Output format is unaligned.
Pager usage is off.
# Schéma PostgreSQL (public)
_Généré le : Tue Jul 14 18:48:06 UTC 2026_

## Tables
- _backup_views
- archetype_nutrition_overrides
- archetypes
- canonical_food_origins
- canonical_food_processes
- canonical_foods
- ciqual_reference
- cooked_dish_ingredients
- cooked_dishes
- cooking_nutrition_factors
- cooking_session_ingredients
- cooking_sessions
- countries
- cultivars
- data_quality_issues
- decision_audit_log
- diets
- food_storage_policies
- generated_recipe_ingredients
- generated_recipes
- household_member_legacy_names
- household_members
- instructions
- inventory_lots
- inventory_movements
- inventory_reservations
- legacy_users
- locations
- meal_feedback
- meal_log
- meal_plan_slots
- meal_plan_validation_issues
- meal_plan_versions
- meal_plans
- meal_stock_deductions
- nutrition_plan_batch_recipes
- nutrition_plan_daily_totals
- nutrition_plan_imports
- nutrition_plan_meals
- nutrition_plan_prep_tasks
- nutrition_plan_shopping_items
- nutrition_target_versions
- nutritional_data
- pantry_items
- plan_regen_requests
- planned_meals
- prep_task_dependencies
- process_nutrition_modifiers
- processes
- products
- recipe_ingredients
- recipe_nutrition_cache
- recipe_nutrition_snapshots
- recipe_pairings
- recipe_steps
- recipe_tags
- recipes
- reference_categories
- reference_subcategories
- seasonality
- tags
- unit_conversions_generic
- unit_conversions_product
- user_allergies
- user_diets
- user_food_bans
- user_health_goals
- user_profiles
- user_recipe_interactions
- waste_prevention_log
- weight_entries

---
## Colonnes

### _backup_views
 - view_schema :: text NOT NULL
 - view_name :: text NOT NULL
 - definition :: text NOT NULL
 - dropped_at :: timestamp with time zone default now() NOT NULL

### archetype_nutrition_overrides
 - archetype_id :: bigint NOT NULL
 - nutrition_id :: bigint NOT NULL
 - reason :: text
 - created_at :: timestamp with time zone default now()
 - updated_at :: timestamp with time zone default now()

### archetypes
 - id :: bigint default nextval('archetypes_id_seq'::regclass) NOT NULL
 - name :: text NOT NULL
 - canonical_food_id :: bigint
 - cultivar_id :: bigint
 - process :: text
 - shelf_life_days :: integer
 - open_shelf_life_days :: integer
 - open_shelf_life_unit :: text default 'days'::text
 - storage_profile :: text
 - created_at :: timestamp with time zone default now() NOT NULL
 - updated_at :: timestamp with time zone default now() NOT NULL
 - notes :: text
 - density_g_per_ml :: numeric
 - grams_per_unit :: numeric
 - primary_unit :: character varying
 - nutrition_modifier_id :: integer
 - is_default :: boolean default false
 - shelf_life_days_pantry :: integer
 - shelf_life_days_fridge :: integer
 - shelf_life_days_freezer :: integer
 - open_shelf_life_days_pantry :: integer
 - open_shelf_life_days_fridge :: integer
 - open_shelf_life_days_freezer :: integer
 - parent_archetype_id :: bigint
 - expiry_kind :: text

### archetypes_shelf_life
 - id :: bigint
 - name :: text
 - canonical_food_id :: bigint
 - process :: text
 - shelf_life_pantry :: integer
 - shelf_life_fridge :: integer
 - shelf_life_freezer :: integer
 - open_shelf_life_pantry :: integer
 - open_shelf_life_fridge :: integer
 - open_shelf_life_freezer :: integer

### canonical_food_origins
 - food_id :: bigint NOT NULL
 - country_id :: integer NOT NULL

### canonical_food_processes
 - id :: integer default nextval('canonical_food_processes_id_seq'::regclass) NOT NULL
 - food_id :: bigint NOT NULL
 - process_id :: integer NOT NULL
 - parameters :: jsonb

### canonical_foods
 - id :: bigint default nextval('canonical_foods_id_seq'::regclass) NOT NULL
 - canonical_name :: text NOT NULL
 - category_id :: bigint
 - keywords :: ARRAY
 - primary_unit :: text default 'u'::text
 - unit_weight_grams :: numeric
 - density_g_per_ml :: numeric
 - shelf_life_days_pantry :: integer
 - shelf_life_days_fridge :: integer
 - shelf_life_days_freezer :: integer
 - created_at :: timestamp with time zone default now()
 - updated_at :: timestamp with time zone default now()
 - subcategory_id :: bigint
 - nutrition_id :: integer
 - source :: text default 'curated'::text NOT NULL
 - verified :: boolean default true NOT NULL

### ciqual_reference
 - alim_code :: text NOT NULL
 - alim_nom_fr :: text NOT NULL
 - groupe :: text
 - sous_groupe :: text

### cooked_dish_ingredients
 - id :: bigint default nextval('cooked_dish_ingredients_id_seq'::regclass) NOT NULL
 - dish_id :: bigint NOT NULL
 - lot_id :: uuid
 - quantity_used :: numeric NOT NULL
 - unit :: text NOT NULL
 - product_name :: text
 - created_at :: timestamp with time zone default now()

### cooked_dishes
 - id :: bigint default nextval('cooked_dishes_id_seq'::regclass) NOT NULL
 - user_id :: uuid NOT NULL
 - name :: text NOT NULL
 - recipe_id :: bigint
 - portions_cooked :: numeric NOT NULL
 - portions_remaining :: numeric NOT NULL
 - storage_method :: text NOT NULL
 - cooked_at :: timestamp with time zone default now() NOT NULL
 - expiration_date :: date NOT NULL
 - consumed_completely_at :: timestamp with time zone
 - notes :: text
 - created_at :: timestamp with time zone default now()
 - updated_at :: timestamp with time zone default now()
 - batch_recipe_id :: bigint
 - kcal_per_portion :: numeric
 - protein_g_per_portion :: numeric
 - carbs_g_per_portion :: numeric
 - fat_g_per_portion :: numeric
 - fiber_g_per_portion :: numeric
 - source_meal_type :: text
 - micronutrients_per_portion :: jsonb
 - generated_recipe_id :: bigint
 - cooking_session_id :: uuid

### cooked_dishes_active
 - id :: bigint
 - user_id :: uuid
 - name :: text
 - recipe_id :: bigint
 - portions_cooked :: numeric
 - portions_remaining :: numeric
 - storage_method :: text
 - cooked_at :: timestamp with time zone
 - expiration_date :: date
 - consumed_completely_at :: timestamp with time zone
 - notes :: text
 - created_at :: timestamp with time zone
 - updated_at :: timestamp with time zone
 - days_until_expiration :: integer
 - recipe_name :: text
 - ingredients_count :: bigint

### cooked_dishes_stats
 - user_id :: uuid
 - total_dishes_cooked :: bigint
 - dishes_with_leftovers :: bigint
 - dishes_fully_consumed :: bigint
 - total_portions_cooked :: numeric
 - total_portions_remaining :: numeric
 - total_portions_consumed :: numeric
 - consumption_rate_percent :: numeric

### cooking_nutrition_factors
 - id :: integer default nextval('cooking_nutrition_factors_id_seq'::regclass) NOT NULL
 - cooking_method :: character varying NOT NULL
 - nutrient_name :: character varying NOT NULL
 - factor_type :: USER-DEFINED NOT NULL
 - factor_value :: numeric NOT NULL

### cooking_session_ingredients
 - id :: uuid default gen_random_uuid() NOT NULL
 - session_id :: uuid NOT NULL
 - planned_name :: text
 - planned_entity_type :: text
 - planned_entity_id :: bigint
 - planned_quantity :: numeric
 - planned_unit :: text
 - actual_action :: text default 'used'::text
 - actual_entity_type :: text
 - actual_entity_id :: bigint
 - actual_quantity :: numeric
 - actual_unit :: text
 - source :: text default 'inventory'::text
 - lot_allocations :: jsonb default '[]'::jsonb NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL

### cooking_sessions
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - recipe_source :: text
 - recipe_id :: integer
 - generated_recipe_id :: bigint
 - planned_servings :: integer
 - actual_servings :: integer
 - portions_eaten :: integer
 - portions_left :: integer
 - meal_date :: date
 - meal_type :: text
 - storage_method :: text
 - status :: text default 'draft'::text NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL
 - committed_at :: timestamp with time zone

### countries
 - id :: integer default nextval('countries_id_seq'::regclass) NOT NULL
 - name :: text NOT NULL

### cultivars
 - id :: bigint default nextval('cultivars_id_seq'::regclass) NOT NULL
 - canonical_food_id :: bigint NOT NULL
 - cultivar_name :: text NOT NULL
 - synonyms :: ARRAY
 - notes :: text
 - created_at :: timestamp with time zone default now() NOT NULL
 - updated_at :: timestamp with time zone default now() NOT NULL
 - density_g_per_ml :: numeric
 - grams_per_unit :: numeric

### data_quality_issues
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - plan_version_id :: uuid
 - entity_type :: text NOT NULL
 - entity_id :: text
 - issue_code :: text NOT NULL
 - severity :: text default 'warning'::text NOT NULL
 - status :: text default 'open'::text NOT NULL
 - details :: jsonb default '{}'::jsonb NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL
 - resolved_at :: timestamp with time zone

### decision_audit_log
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - plan_version_id :: uuid
 - decision_type :: text NOT NULL
 - rules_version :: text NOT NULL
 - input_fingerprint :: text
 - decision :: jsonb default '{}'::jsonb NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL

### diets
 - id :: bigint default nextval('diets_id_seq'::regclass) NOT NULL
 - name :: text NOT NULL

### food_storage_policies
 - id :: bigint NOT NULL
 - canonical_food_id :: bigint
 - archetype_id :: bigint
 - food_state :: text default 'any'::text NOT NULL
 - purchase_state :: text default 'any'::text NOT NULL
 - storage_method :: text NOT NULL
 - suitability :: text NOT NULL
 - duration_days :: integer
 - expiry_kind :: text default 'estimate'::text NOT NULL
 - min_temperature_c :: numeric
 - max_temperature_c :: numeric
 - source_type :: text NOT NULL
 - source_ref :: text
 - confidence :: numeric NOT NULL
 - policy_version :: text NOT NULL
 - reason :: text
 - verified_at :: timestamp with time zone default now() NOT NULL
 - active :: boolean default true NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL
 - updated_at :: timestamp with time zone default now() NOT NULL

### generated_recipe_ingredients
 - id :: bigint NOT NULL
 - generated_recipe_id :: bigint NOT NULL
 - raw_name :: text NOT NULL
 - quantity :: numeric
 - unit :: text
 - notes :: text
 - canonical_food_id :: bigint
 - archetype_id :: bigint
 - match_status :: text default 'unmatched'::text NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL
 - match_confidence :: numeric
 - resolution_source :: text
 - resolved_at :: timestamp with time zone
 - review_status :: text

### generated_recipes
 - id :: bigint default nextval('generated_recipes_id_seq'::regclass) NOT NULL
 - user_id :: uuid NOT NULL
 - name_normalized :: text NOT NULL
 - title :: text NOT NULL
 - description :: text
 - servings :: integer default 2
 - prep_min :: integer
 - cook_min :: integer
 - ingredients :: jsonb default '[]'::jsonb NOT NULL
 - steps :: jsonb default '[]'::jsonb NOT NULL
 - chef_tips :: text
 - nutrition_per_serving :: jsonb
 - source :: text default 'ai'::text
 - created_at :: timestamp with time zone default now()
 - rating :: integer
 - cook_count :: integer default 0
 - image_url :: text
 - status :: text default 'ready'::text NOT NULL

### household_member_legacy_names
 - id :: bigint NOT NULL
 - user_id :: uuid NOT NULL
 - household_member_id :: uuid NOT NULL
 - normalized_name :: text NOT NULL
 - raw_name :: text
 - created_at :: timestamp with time zone default now() NOT NULL

### household_members
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - name :: text NOT NULL
 - member_type :: text default 'adult'::text NOT NULL
 - portion_multiplier :: numeric default 1 NOT NULL
 - active :: boolean default true NOT NULL
 - preferences :: jsonb default '{}'::jsonb NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL
 - updated_at :: timestamp with time zone default now() NOT NULL

### instructions
 - id :: integer default nextval('instructions_id_seq'::regclass) NOT NULL
 - recipe_id :: integer NOT NULL
 - step_number :: integer NOT NULL
 - description :: text NOT NULL

### inventory_available_lots_v2
 - id :: uuid
 - user_id :: uuid
 - product_id :: uuid
 - canonical_food_id :: bigint
 - archetype_id :: bigint
 - cultivar_id :: bigint
 - physical_quantity :: numeric
 - reserved_quantity :: numeric
 - available_quantity :: numeric
 - unit :: character varying
 - storage_method :: character varying
 - storage_place :: character varying
 - expiration_date :: date
 - adjusted_expiration_date :: date
 - is_opened :: boolean
 - requires_storage_review :: boolean

### inventory_lots
 - id :: uuid default gen_random_uuid() NOT NULL
 - qty_remaining :: numeric default 0 NOT NULL
 - initial_qty :: numeric NOT NULL
 - unit :: character varying default 'unités'::character varying NOT NULL
 - storage_method :: character varying default 'pantry'::character varying NOT NULL
 - storage_place :: character varying default 'Garde-manger'::character varying
 - acquired_on :: date default CURRENT_DATE NOT NULL
 - expiration_date :: date
 - notes :: text
 - user_id :: uuid default auth.uid()
 - created_at :: timestamp with time zone default now()
 - updated_at :: timestamp with time zone default now()
 - product_id :: uuid
 - canonical_food_id :: bigint
 - cultivar_id :: bigint
 - archetype_id :: bigint
 - adjusted_expiration_date :: date
 - is_opened :: boolean default false
 - opened_at :: timestamp without time zone
 - container_size :: numeric
 - container_unit :: character varying
 - is_containerized :: boolean default false
 - storage_decision_source :: text default 'legacy'::text NOT NULL
 - storage_decision_confidence :: numeric
 - storage_policy_version :: text
 - expiration_source :: text default 'legacy'::text NOT NULL
 - expiration_kind :: text default 'unknown'::text NOT NULL
 - requires_storage_review :: boolean default false NOT NULL
 - label_use_by_date :: date
 - label_best_before_date :: date

### inventory_lots_effective
 - id :: uuid
 - user_id :: uuid
 - qty_remaining :: numeric
 - initial_qty :: numeric
 - unit :: character varying
 - acquired_on :: date
 - expiration_date :: date
 - storage_method :: character varying
 - storage_place :: character varying
 - effective_archetype_id :: bigint
 - effective_product_id :: uuid

### inventory_lots_resolved
 - id :: uuid
 - qty_remaining :: numeric
 - initial_qty :: numeric
 - unit :: character varying
 - storage_method :: character varying
 - storage_place :: character varying
 - acquired_on :: date
 - expiration_date :: date
 - notes :: text
 - user_id :: uuid
 - created_at :: timestamp with time zone
 - updated_at :: timestamp with time zone
 - product_id :: uuid
 - canonical_food_id :: bigint
 - cultivar_id :: bigint
 - archetype_id :: bigint
 - resolved_canonical_food_id :: bigint
 - resolved_archetype_id :: bigint

### inventory_lots_with_effective_dlc
 - id :: uuid
 - qty_remaining :: numeric
 - initial_qty :: numeric
 - unit :: character varying
 - storage_method :: character varying
 - storage_place :: character varying
 - acquired_on :: date
 - expiration_date :: date
 - notes :: text
 - user_id :: uuid
 - created_at :: timestamp with time zone
 - updated_at :: timestamp with time zone
 - product_id :: uuid
 - canonical_food_id :: bigint
 - cultivar_id :: bigint
 - archetype_id :: bigint
 - adjusted_expiration_date :: date
 - is_opened :: boolean
 - opened_at :: timestamp without time zone
 - effective_expiration_date :: date
 - days_until_expiration :: integer

### inventory_movements
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - lot_id :: uuid
 - session_id :: uuid
 - movement_type :: text NOT NULL
 - quantity_before :: numeric
 - quantity_delta :: numeric NOT NULL
 - quantity_after :: numeric
 - created_at :: timestamp with time zone default now() NOT NULL

### inventory_reservations
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - plan_version_id :: uuid NOT NULL
 - slot_id :: uuid NOT NULL
 - lot_id :: uuid
 - canonical_food_id :: bigint
 - ingredient_name :: text NOT NULL
 - reserved_quantity :: numeric NOT NULL
 - reserved_unit :: text NOT NULL
 - needed_quantity :: numeric
 - needed_unit :: text
 - status :: text default 'active'::text NOT NULL
 - metadata :: jsonb default '{}'::jsonb NOT NULL
 - reserved_at :: timestamp with time zone default now() NOT NULL
 - consumed_at :: timestamp with time zone
 - released_at :: timestamp with time zone

### legacy_users
 - id :: integer default nextval('users_id_seq'::regclass) NOT NULL
 - username :: text NOT NULL

### locations
 - id :: uuid default gen_random_uuid() NOT NULL
 - name :: text NOT NULL
 - sort_order :: integer default 0
 - icon :: text

### meal_feedback
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - slot_id :: uuid NOT NULL
 - plan_version_id :: uuid NOT NULL
 - household_member_id :: uuid
 - adherence :: text default 'planned'::text NOT NULL
 - rating :: integer
 - reason_codes :: ARRAY default '{}'::text[] NOT NULL
 - notes :: text
 - actual_recipe_id :: bigint
 - created_at :: timestamp with time zone default now() NOT NULL

### meal_log
 - id :: bigint default nextval('meal_log_id_seq'::regclass) NOT NULL
 - user_id :: uuid NOT NULL
 - person_name :: text NOT NULL
 - meal_date :: date NOT NULL
 - meal_type :: text NOT NULL
 - cooked_dish_id :: bigint
 - recipe_id :: bigint
 - description :: text
 - portions_eaten :: numeric default 1.0
 - kcal :: numeric
 - protein_g :: numeric
 - carbs_g :: numeric
 - fat_g :: numeric
 - fiber_g :: numeric
 - micronutrients :: jsonb
 - created_at :: timestamp with time zone default now()
 - cooking_session_id :: uuid
 - household_member_id :: uuid

### meal_plan_slots
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - plan_version_id :: uuid NOT NULL
 - slot_key :: text NOT NULL
 - meal_date :: date NOT NULL
 - meal_type :: text NOT NULL
 - title :: text NOT NULL
 - generated_recipe_id :: bigint
 - cooked_dish_id :: bigint
 - servings :: numeric default 1 NOT NULL
 - status :: text default 'planned'::text NOT NULL
 - locked :: boolean default false NOT NULL
 - source :: text default 'plan'::text NOT NULL
 - nutrition_by_member :: jsonb default '{}'::jsonb NOT NULL
 - nutrition_total :: jsonb default '{}'::jsonb NOT NULL
 - preparation :: jsonb default '{}'::jsonb NOT NULL
 - stock_summary :: jsonb default '{}'::jsonb NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL
 - updated_at :: timestamp with time zone default now() NOT NULL

### meal_plan_validation_issues
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - plan_version_id :: uuid NOT NULL
 - slot_id :: uuid
 - severity :: text NOT NULL
 - code :: text NOT NULL
 - message :: text NOT NULL
 - details :: jsonb default '{}'::jsonb NOT NULL
 - resolved_at :: timestamp with time zone
 - created_at :: timestamp with time zone default now() NOT NULL

### meal_plan_versions
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - import_id :: bigint NOT NULL
 - version_no :: integer NOT NULL
 - status :: text default 'draft'::text NOT NULL
 - source :: text default 'closed_loop'::text NOT NULL
 - window_start :: date NOT NULL
 - window_end :: date NOT NULL
 - input_hash :: text NOT NULL
 - input_snapshot :: jsonb default '{}'::jsonb NOT NULL
 - objective_scores :: jsonb default '{}'::jsonb NOT NULL
 - validation_summary :: jsonb default '{}'::jsonb NOT NULL
 - rules_version :: text default 'closed-loop-v1'::text NOT NULL
 - published_at :: timestamp with time zone
 - superseded_at :: timestamp with time zone
 - created_at :: timestamp with time zone default now() NOT NULL
 - updated_at :: timestamp with time zone default now() NOT NULL

### meal_plans
 - id :: integer default nextval('meal_plans_id_seq'::regclass) NOT NULL
 - user_id :: integer NOT NULL
 - week_start_date :: date NOT NULL

### meal_stock_deductions
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid()
 - meal_date :: date NOT NULL
 - meal_type :: text NOT NULL
 - lot_id :: uuid
 - lot_snapshot :: jsonb NOT NULL
 - qty_deducted :: numeric NOT NULL
 - restored :: boolean default false NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL

### nutrition_plan_batch_recipes
 - id :: bigint default nextval('nutrition_plan_batch_recipes_id_seq'::regclass) NOT NULL
 - import_id :: bigint NOT NULL
 - name :: text NOT NULL
 - timing :: text
 - ingredients :: text
 - macros_per_100g :: text
 - rendement :: text
 - portions :: text
 - reheat :: text
 - instructions :: text
 - cook_date :: date
 - portions_total :: integer
 - conservation :: text
 - keeps_days :: integer
 - freezable :: boolean
 - ingredients_json :: jsonb

### nutrition_plan_daily_totals
 - id :: bigint default nextval('nutrition_plan_daily_totals_id_seq'::regclass) NOT NULL
 - import_id :: bigint NOT NULL
 - person_name :: text NOT NULL
 - meal_date :: date NOT NULL
 - kcal :: numeric
 - protein_g :: numeric
 - carbs_g :: numeric
 - fat_g :: numeric
 - fiber_g :: numeric
 - validated :: boolean default false
 - household_member_id :: uuid

### nutrition_plan_imports
 - id :: bigint default nextval('nutrition_plan_imports_id_seq'::regclass) NOT NULL
 - user_id :: uuid NOT NULL
 - file_name :: text NOT NULL
 - month_label :: text
 - date_range_start :: date
 - date_range_end :: date
 - created_at :: timestamp with time zone default now() NOT NULL
 - raw_json :: text
 - active_plan_version_id :: uuid

### nutrition_plan_meals
 - id :: bigint default nextval('nutrition_plan_meals_id_seq'::regclass) NOT NULL
 - import_id :: bigint NOT NULL
 - person_name :: text NOT NULL
 - meal_date :: date NOT NULL
 - meal_type :: text NOT NULL
 - day_type :: text
 - description :: text NOT NULL
 - kcal :: numeric
 - protein_g :: numeric
 - carbs_g :: numeric
 - fat_g :: numeric
 - fiber_g :: numeric
 - short_label :: text
 - batch_recipe_id :: bigint
 - generated_recipe_id :: bigint
 - is_leftover :: boolean default false NOT NULL
 - cooked_dish_id :: bigint
 - meal_plan_slot_id :: uuid
 - planned_servings :: numeric default 1 NOT NULL
 - locked :: boolean default false NOT NULL
 - nutrition_source :: text default 'legacy'::text NOT NULL
 - nutrition_confidence :: numeric
 - household_member_id :: uuid

### nutrition_plan_prep_tasks
 - id :: bigint default nextval('nutrition_plan_prep_tasks_id_seq'::regclass) NOT NULL
 - import_id :: bigint NOT NULL
 - prep_date :: date
 - prep_label :: text
 - task :: text NOT NULL
 - estimated_time :: text
 - done :: boolean default false NOT NULL
 - done_at :: timestamp with time zone
 - plan_version_id :: uuid
 - meal_plan_slot_id :: uuid
 - stable_key :: text
 - task_type :: text default 'legacy'::text NOT NULL
 - workflow_status :: text default 'pending'::text NOT NULL
 - earliest_start_at :: timestamp with time zone
 - due_at :: timestamp with time zone
 - safety_deadline_at :: timestamp with time zone
 - duration_min :: integer
 - priority :: integer default 50 NOT NULL
 - source :: text default 'legacy'::text NOT NULL
 - instructions_json :: jsonb default '[]'::jsonb NOT NULL
 - snoozed_until :: timestamp with time zone

### nutrition_plan_shopping_items
 - id :: bigint default nextval('nutrition_plan_shopping_items_id_seq'::regclass) NOT NULL
 - import_id :: bigint NOT NULL
 - week_label :: text NOT NULL
 - category :: text
 - product_name :: text NOT NULL
 - quantity :: text
 - checked :: boolean default false
 - canonical_food_id :: bigint
 - archetype_id :: bigint
 - notes :: text
 - container_qty :: integer
 - container_size :: numeric
 - container_unit :: text
 - image_url :: text
 - created_lot_ids :: ARRAY
 - match_confidence :: numeric
 - resolution_source :: text
 - resolved_at :: timestamp with time zone
 - review_status :: text
 - plan_version_id :: uuid
 - required_qty :: numeric
 - stock_qty :: numeric
 - reserved_qty :: numeric
 - incoming_qty :: numeric
 - purchase_qty :: numeric
 - purchase_unit :: text
 - shopping_status :: text default 'needed'::text NOT NULL
 - planning_source :: text default 'legacy'::text NOT NULL
 - aisle_order :: integer default 999 NOT NULL
 - shortage_reason :: text
 - needed_by :: date

### nutrition_target_versions
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - member_id :: uuid NOT NULL
 - effective_from :: date default CURRENT_DATE NOT NULL
 - effective_to :: date
 - target_kcal :: numeric
 - target_protein_g :: numeric
 - target_carbs_g :: numeric
 - target_fat_g :: numeric
 - target_fiber_g :: numeric
 - tolerance_percent :: numeric default 10 NOT NULL
 - source :: text default 'legacy_goal'::text NOT NULL
 - rationale :: jsonb default '{}'::jsonb NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL

### nutritional_data
 - id :: bigint default nextval('nutritional_data_id_seq'::regclass) NOT NULL
 - source_id :: character varying
 - calories_kcal :: numeric
 - proteines_g :: numeric
 - glucides_g :: numeric
 - lipides_g :: numeric
 - fibres_g :: numeric
 - sucres_g :: numeric
 - ag_satures_g :: numeric
 - ag_monoinsatures_g :: numeric
 - ag_polyinsatures_g :: numeric
 - cholesterol_mg :: numeric
 - calcium_mg :: numeric
 - fer_mg :: numeric
 - magnesium_mg :: numeric
 - phosphore_mg :: numeric
 - potassium_mg :: numeric
 - sodium_mg :: numeric
 - zinc_mg :: numeric
 - cuivre_mg :: numeric
 - selenium_ug :: numeric
 - iode_ug :: numeric
 - vitamine_a_ug :: numeric
 - beta_carotene_ug :: numeric
 - vitamine_d_ug :: numeric
 - vitamine_e_mg :: numeric
 - vitamine_k_ug :: numeric
 - vitamine_c_mg :: numeric
 - vitamine_b1_mg :: numeric
 - vitamine_b2_mg :: numeric
 - vitamine_b3_mg :: numeric
 - vitamine_b5_mg :: numeric
 - vitamine_b6_mg :: numeric
 - vitamine_b9_ug :: numeric
 - vitamine_b12_ug :: numeric

### pantry_items
 - id :: integer default nextval('pantry_items_id_seq'::regclass) NOT NULL
 - user_id :: integer NOT NULL
 - product_id :: uuid NOT NULL
 - quantity :: numeric NOT NULL
 - expiry_date :: date

### pantry_view
 - lot_id :: uuid
 - user_id :: uuid
 - qty_remaining :: numeric
 - initial_qty :: numeric
 - unit :: character varying
 - acquired_on :: date
 - expiration_date :: date
 - storage_method :: character varying
 - storage_place :: character varying
 - effective_product_id :: uuid
 - effective_archetype_id :: bigint
 - product_name :: text
 - product_brand :: text
 - archetype_name :: text
 - canonical_name :: text

### plan_regen_requests
 - id :: bigint NOT NULL
 - user_id :: uuid NOT NULL
 - import_id :: bigint
 - target_days :: ARRAY
 - target_start :: date NOT NULL
 - target_end :: date NOT NULL
 - status :: text default 'pending'::text NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL
 - target_meals :: jsonb
 - user_instructions :: text
 - error_message :: text
 - updated_at :: timestamp with time zone default now()

### planned_meals
 - id :: integer default nextval('planned_meals_id_seq'::regclass) NOT NULL
 - plan_id :: integer NOT NULL
 - recipe_id :: integer NOT NULL
 - meal_date :: date NOT NULL
 - meal_type :: USER-DEFINED NOT NULL

### prep_task_dependencies
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - plan_version_id :: uuid NOT NULL
 - task_id :: bigint NOT NULL
 - depends_on_task_id :: bigint NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL

### process_nutrition_modifiers
 - id :: bigint default nextval('process_nutrition_modifiers_id_seq'::regclass) NOT NULL
 - process_pattern :: text NOT NULL
 - category :: text NOT NULL
 - nutrient_name :: text NOT NULL
 - factor_type :: text NOT NULL
 - factor_value :: numeric NOT NULL
 - description :: text
 - priority :: integer default 100
 - created_at :: timestamp with time zone default now()
 - updated_at :: timestamp with time zone default now()

### processes
 - id :: integer default nextval('processes_id_seq'::regclass) NOT NULL
 - name :: text NOT NULL
 - description :: text

### products
 - id :: uuid default gen_random_uuid() NOT NULL
 - archetype_id :: bigint NOT NULL
 - name :: text NOT NULL
 - brand :: text
 - ean :: text
 - package_size :: numeric
 - package_unit :: text
 - package_count :: integer default 1
 - shelf_life_days :: integer
 - shelf_life_after_opening_days :: integer
 - shelf_life_after_opening_unit :: text default 'days'::text
 - needs_opening_tracking :: boolean default false
 - nutrition_override :: jsonb
 - created_at :: timestamp with time zone default now() NOT NULL
 - updated_at :: timestamp with time zone default now() NOT NULL
 - is_default :: boolean default false
 - is_auto_generated :: boolean default false NOT NULL

### recipe_ingredients
 - id :: integer default nextval('recipe_ingredients_id_seq'::regclass) NOT NULL
 - recipe_id :: integer NOT NULL
 - archetype_id :: bigint
 - canonical_food_id :: bigint
 - quantity :: numeric NOT NULL
 - unit :: character varying NOT NULL
 - notes :: text
 - sub_recipe_id :: bigint
 - updated_at :: timestamp with time zone default now()

### recipe_nutrition_cache
 - recipe_id :: integer NOT NULL
 - calories_per_serving :: numeric
 - proteines_per_serving :: numeric
 - glucides_per_serving :: numeric
 - lipides_per_serving :: numeric
 - calories_total :: numeric
 - proteines_total :: numeric
 - glucides_total :: numeric
 - lipides_total :: numeric
 - servings :: integer NOT NULL
 - cooking_method :: character varying
 - calculated_at :: timestamp with time zone default now()
 - ingredients_hash :: text

### recipe_nutrition_snapshots
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid() NOT NULL
 - generated_recipe_id :: bigint NOT NULL
 - version_no :: integer NOT NULL
 - ingredients_hash :: text NOT NULL
 - source :: text default 'recipe_declared'::text NOT NULL
 - serving_count :: numeric default 1 NOT NULL
 - nutrition_per_serving :: jsonb default '{}'::jsonb NOT NULL
 - micronutrients :: jsonb default '{}'::jsonb NOT NULL
 - data_quality :: jsonb default '{}'::jsonb NOT NULL
 - created_at :: timestamp with time zone default now() NOT NULL

### recipe_pairings
 - main_recipe_id :: integer NOT NULL
 - side_recipe_id :: integer NOT NULL

### recipe_steps
 - id :: integer default nextval('recipe_steps_id_seq'::regclass) NOT NULL
 - recipe_id :: integer NOT NULL
 - step_no :: integer NOT NULL
 - instruction :: text NOT NULL
 - duration_min :: integer
 - temperature :: integer
 - temperature_unit :: character varying default '°C'::character varying
 - created_at :: timestamp without time zone default now()

### recipe_tags
 - recipe_id :: integer NOT NULL
 - tag_id :: integer NOT NULL

### recipes
 - id :: integer default nextval('recipes_id_seq'::regclass) NOT NULL
 - name :: text NOT NULL
 - description :: text
 - prep_time_minutes :: integer
 - cook_time_minutes :: integer
 - servings :: integer
 - cooking_method :: character varying
 - role :: USER-DEFINED NOT NULL
 - is_scalable_to_main :: boolean default false
 - is_complete_meal :: boolean default false
 - needs_side_dish :: boolean

### reference_categories
 - id :: bigint default nextval('reference_categories_id_seq'::regclass) NOT NULL
 - name :: text NOT NULL
 - icon :: text
 - color_hex :: text
 - typical_storage :: text
 - average_shelf_life_days :: integer
 - sort_priority :: integer default 50

### reference_subcategories
 - id :: bigint default nextval('reference_subcategories_id_seq'::regclass) NOT NULL
 - category_id :: bigint NOT NULL
 - code :: text NOT NULL
 - label :: text NOT NULL
 - icon :: text

### seasonality
 - id :: integer default nextval('seasonality_id_seq'::regclass) NOT NULL
 - food_id :: bigint NOT NULL
 - start_month :: integer NOT NULL
 - end_month :: integer NOT NULL

### tags
 - id :: integer default nextval('tags_id_seq'::regclass) NOT NULL
 - name :: text NOT NULL

### unit_conversions
 - product_id :: uuid
 - from_unit :: text
 - to_unit :: text
 - factor :: numeric
 - is_product_specific :: boolean

### unit_conversions_generic
 - id :: uuid default gen_random_uuid() NOT NULL
 - from_unit :: text NOT NULL
 - to_unit :: text NOT NULL
 - factor :: numeric NOT NULL
 - created_at :: timestamp with time zone default now()

### unit_conversions_product
 - id :: uuid default gen_random_uuid() NOT NULL
 - product_id :: uuid NOT NULL
 - from_unit :: text NOT NULL
 - to_unit :: text NOT NULL
 - factor :: numeric NOT NULL
 - created_at :: timestamp with time zone default now()

### user_allergies
 - user_id :: uuid NOT NULL
 - canonical_food_id :: bigint NOT NULL

### user_diets
 - user_id :: uuid NOT NULL
 - diet_id :: bigint NOT NULL

### user_food_bans
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid()
 - name :: text NOT NULL
 - canonical_food_id :: bigint
 - kind :: text default 'ban'::text NOT NULL
 - note :: text
 - created_at :: timestamp with time zone default now() NOT NULL

### user_health_goals
 - user_id :: uuid NOT NULL
 - target_calories :: numeric
 - target_protein_g :: numeric
 - target_fat_g :: numeric
 - target_carbs_g :: numeric
 - created_at :: timestamp with time zone default now() NOT NULL
 - updated_at :: timestamp with time zone default now() NOT NULL
 - person_name :: text default 'Julien'::text NOT NULL
 - target_weight_kg :: numeric
 - target_fiber_g :: numeric
 - age :: integer
 - sex :: text
 - height_cm :: numeric
 - current_weight_kg :: numeric
 - activity_level :: text
 - weight_loss_rate :: numeric
 - bmr :: numeric
 - tdee :: numeric
 - household_member_id :: uuid

### user_profiles
 - user_id :: uuid NOT NULL
 - novelty_preference :: numeric
 - created_at :: timestamp with time zone default now() NOT NULL
 - updated_at :: timestamp with time zone default now() NOT NULL

### user_recipe_interactions
 - id :: integer default nextval('user_recipe_interactions_id_seq'::regclass) NOT NULL
 - user_id :: integer NOT NULL
 - recipe_id :: integer NOT NULL
 - rating :: integer
 - is_favorite :: boolean
 - cook_count :: integer default 0
 - last_cooked_date :: date

### v_expiring_archetypes
 - user_id :: uuid
 - expiration_date :: date
 - qty_remaining :: numeric
 - effective_archetype_id :: bigint

### view_canonical_with_categories
 - id :: bigint
 - canonical_name :: text
 - category_id :: bigint
 - category_label :: text
 - subcategory_id :: bigint
 - subcategory_label :: text
 - primary_unit :: text
 - density_g_per_ml :: numeric
 - created_at :: timestamp with time zone
 - updated_at :: timestamp with time zone

### waste_prevention_log
 - id :: uuid default gen_random_uuid() NOT NULL
 - user_id :: uuid default auth.uid()
 - lot_id :: uuid
 - action :: text
 - quantity :: numeric
 - unit :: text
 - estimated_value_eur :: numeric
 - created_at :: timestamp with time zone default now() NOT NULL

### weight_entries
 - id :: bigint default nextval('weight_entries_id_seq'::regclass) NOT NULL
 - user_id :: uuid NOT NULL
 - person_name :: text NOT NULL
 - date :: date NOT NULL
 - weight_kg :: numeric NOT NULL
 - notes :: text
 - created_at :: timestamp with time zone default now()
 - household_member_id :: uuid

---
## Clés primaires
 - _backup_views → (dropped_at, view_schema, view_name)
 - archetype_nutrition_overrides → (archetype_id)
 - archetypes → (id)
 - canonical_food_origins → (food_id, country_id)
 - canonical_food_processes → (id)
 - canonical_foods → (id)
 - ciqual_reference → (alim_code)
 - cooked_dish_ingredients → (id)
 - cooked_dishes → (id)
 - cooking_nutrition_factors → (id)
 - cooking_session_ingredients → (id)
 - cooking_sessions → (id)
 - countries → (id)
 - cultivars → (id)
 - data_quality_issues → (id)
 - decision_audit_log → (id)
 - diets → (id)
 - food_storage_policies → (id)
 - generated_recipe_ingredients → (id)
 - generated_recipes → (id)
 - household_member_legacy_names → (id)
 - household_members → (id)
 - instructions → (id)
 - inventory_lots → (id)
 - inventory_movements → (id)
 - inventory_reservations → (id)
 - legacy_users → (id)
 - locations → (id)
 - meal_feedback → (id)
 - meal_log → (id)
 - meal_plan_slots → (id)
 - meal_plan_validation_issues → (id)
 - meal_plan_versions → (id)
 - meal_plans → (id)
 - meal_stock_deductions → (id)
 - nutrition_plan_batch_recipes → (id)
 - nutrition_plan_daily_totals → (id)
 - nutrition_plan_imports → (id)
 - nutrition_plan_meals → (id)
 - nutrition_plan_prep_tasks → (id)
 - nutrition_plan_shopping_items → (id)
 - nutrition_target_versions → (id)
 - nutritional_data → (id)
 - pantry_items → (id)
 - plan_regen_requests → (id)
 - planned_meals → (id)
 - prep_task_dependencies → (id)
 - process_nutrition_modifiers → (id)
 - processes → (id)
 - products → (id)
 - recipe_ingredients → (id)
 - recipe_nutrition_cache → (recipe_id)
 - recipe_nutrition_snapshots → (id)
 - recipe_pairings → (side_recipe_id, main_recipe_id)
 - recipe_steps → (id)
 - recipe_tags → (recipe_id, tag_id)
 - recipes → (id)
 - reference_categories → (id)
 - reference_subcategories → (id)
 - seasonality → (id)
 - tags → (id)
 - unit_conversions_generic → (id)
 - unit_conversions_product → (id)
 - user_allergies → (canonical_food_id, user_id)
 - user_diets → (user_id, diet_id)
 - user_food_bans → (id)
 - user_health_goals → (user_id, person_name)
 - user_profiles → (user_id)
 - user_recipe_interactions → (id)
 - waste_prevention_log → (id)
 - weight_entries → (id)

---
## Clés étrangères
 - archetype_nutrition_overrides.archetype_id → archetypes.id  (constraint archetype_nutrition_overrides_archetype_id_fkey)
 - archetype_nutrition_overrides.nutrition_id → nutritional_data.id  (constraint archetype_nutrition_overrides_nutrition_id_fkey)
 - archetypes.parent_archetype_id → archetypes.id  (constraint fk_parent_archetype)
 - archetypes.canonical_food_id → canonical_foods.id  (constraint archetypes_canonical_food_id_fkey)
 - archetypes.cultivar_id → cultivars.id  (constraint archetypes_cultivar_id_fkey)
 - canonical_food_origins.food_id → canonical_foods.id  (constraint canonical_food_origins_food_id_fkey)
 - canonical_food_origins.country_id → countries.id  (constraint canonical_food_origins_country_id_fkey)
 - canonical_food_processes.food_id → canonical_foods.id  (constraint canonical_food_processes_food_id_fkey)
 - canonical_food_processes.process_id → processes.id  (constraint canonical_food_processes_process_id_fkey)
 - canonical_foods.nutrition_id → nutritional_data.id  (constraint canonical_foods_nutrition_id_fkey)
 - canonical_foods.category_id → reference_categories.id  (constraint canonical_foods_category_id_fkey)
 - canonical_foods.subcategory_id → reference_subcategories.id  (constraint canonical_foods_subcategory_id_fkey)
 - cooked_dish_ingredients.dish_id → cooked_dishes.id  (constraint cooked_dish_ingredients_dish_id_fkey)
 - cooked_dish_ingredients.lot_id → inventory_lots.id  (constraint cooked_dish_ingredients_lot_id_fkey)
 - cooked_dishes.cooking_session_id → cooking_sessions.id  (constraint cooked_dishes_cooking_session_id_fkey)
 - cooked_dishes.recipe_id → recipes.id  (constraint cooked_dishes_recipe_id_fkey)
 - cooked_dishes.generated_recipe_id → generated_recipes.id  (constraint cooked_dishes_generated_recipe_id_fkey)
 - cooking_session_ingredients.session_id → cooking_sessions.id  (constraint cooking_session_ingredients_session_id_fkey)
 - cooking_sessions.recipe_id → recipes.id  (constraint cooking_sessions_recipe_id_fkey)
 - cooking_sessions.generated_recipe_id → generated_recipes.id  (constraint cooking_sessions_generated_recipe_id_fkey)
 - cultivars.canonical_food_id → canonical_foods.id  (constraint cultivars_canonical_food_id_fkey)
 - data_quality_issues.plan_version_id → meal_plan_versions.id  (constraint data_quality_issues_plan_version_id_fkey)
 - decision_audit_log.plan_version_id → meal_plan_versions.id  (constraint decision_audit_log_plan_version_id_fkey)
 - food_storage_policies.archetype_id → archetypes.id  (constraint food_storage_policies_archetype_id_fkey)
 - food_storage_policies.canonical_food_id → canonical_foods.id  (constraint food_storage_policies_canonical_food_id_fkey)
 - generated_recipe_ingredients.canonical_food_id → canonical_foods.id  (constraint fk_gri_canonical_food)
 - generated_recipe_ingredients.generated_recipe_id → generated_recipes.id  (constraint generated_recipe_ingredients_generated_recipe_id_fkey)
 - generated_recipe_ingredients.archetype_id → archetypes.id  (constraint fk_gri_archetype)
 - household_member_legacy_names.household_member_id → household_members.id  (constraint household_member_legacy_names_household_member_id_fkey)
 - instructions.recipe_id → recipes.id  (constraint instructions_recipe_id_fkey)
 - inventory_lots.cultivar_id → cultivars.id  (constraint inventory_lots_cultivar_fk)
 - inventory_lots.product_id → products.id  (constraint inventory_lots_product_fk)
 - inventory_lots.archetype_id → archetypes.id  (constraint inventory_lots_archetype_fk)
 - inventory_lots.canonical_food_id → canonical_foods.id  (constraint inventory_lots_canonical_fk)
 - inventory_movements.session_id → cooking_sessions.id  (constraint inventory_movements_session_id_fkey)
 - inventory_movements.lot_id → inventory_lots.id  (constraint inventory_movements_lot_id_fkey)
 - inventory_reservations.canonical_food_id → canonical_foods.id  (constraint inventory_reservations_canonical_food_id_fkey)
 - inventory_reservations.slot_id → meal_plan_slots.id  (constraint inventory_reservations_slot_id_fkey)
 - inventory_reservations.plan_version_id → meal_plan_versions.id  (constraint inventory_reservations_plan_version_id_fkey)
 - inventory_reservations.lot_id → inventory_lots.id  (constraint inventory_reservations_lot_id_fkey)
 - meal_feedback.household_member_id → household_members.id  (constraint meal_feedback_household_member_id_fkey)
 - meal_feedback.plan_version_id → meal_plan_versions.id  (constraint meal_feedback_plan_version_id_fkey)
 - meal_feedback.actual_recipe_id → generated_recipes.id  (constraint meal_feedback_actual_recipe_id_fkey)
 - meal_feedback.slot_id → meal_plan_slots.id  (constraint meal_feedback_slot_id_fkey)
 - meal_log.household_member_id → household_members.id  (constraint meal_log_household_member_id_fkey)
 - meal_log.cooking_session_id → cooking_sessions.id  (constraint meal_log_cooking_session_id_fkey)
 - meal_log.cooked_dish_id → cooked_dishes.id  (constraint meal_log_cooked_dish_id_fkey)
 - meal_log.recipe_id → recipes.id  (constraint meal_log_recipe_id_fkey)
 - meal_plan_slots.plan_version_id → meal_plan_versions.id  (constraint meal_plan_slots_plan_version_id_fkey)
 - meal_plan_slots.cooked_dish_id → cooked_dishes.id  (constraint meal_plan_slots_cooked_dish_id_fkey)
 - meal_plan_slots.generated_recipe_id → generated_recipes.id  (constraint meal_plan_slots_generated_recipe_id_fkey)
 - meal_plan_validation_issues.slot_id → meal_plan_slots.id  (constraint meal_plan_validation_issues_slot_id_fkey)
 - meal_plan_validation_issues.plan_version_id → meal_plan_versions.id  (constraint meal_plan_validation_issues_plan_version_id_fkey)
 - meal_plan_versions.import_id → nutrition_plan_imports.id  (constraint meal_plan_versions_import_id_fkey)
 - meal_plans.user_id → legacy_users.id  (constraint meal_plans_user_id_fkey)
 - meal_stock_deductions.lot_id → inventory_lots.id  (constraint meal_stock_deductions_lot_id_fkey)
 - nutrition_plan_batch_recipes.import_id → nutrition_plan_imports.id  (constraint nutrition_plan_batch_recipes_import_id_fkey)
 - nutrition_plan_daily_totals.household_member_id → household_members.id  (constraint nutrition_plan_daily_totals_household_member_id_fkey)
 - nutrition_plan_daily_totals.import_id → nutrition_plan_imports.id  (constraint nutrition_plan_daily_totals_import_id_fkey)
 - nutrition_plan_imports.active_plan_version_id → meal_plan_versions.id  (constraint nutrition_plan_imports_active_plan_version_id_fkey)
 - nutrition_plan_meals.household_member_id → household_members.id  (constraint nutrition_plan_meals_household_member_id_fkey)
 - nutrition_plan_meals.batch_recipe_id → nutrition_plan_batch_recipes.id  (constraint nutrition_plan_meals_batch_recipe_id_fkey)
 - nutrition_plan_meals.import_id → nutrition_plan_imports.id  (constraint nutrition_plan_meals_import_id_fkey)
 - nutrition_plan_meals.cooked_dish_id → cooked_dishes.id  (constraint nutrition_plan_meals_cooked_dish_id_fkey)
 - nutrition_plan_meals.meal_plan_slot_id → meal_plan_slots.id  (constraint nutrition_plan_meals_meal_plan_slot_id_fkey)
 - nutrition_plan_meals.generated_recipe_id → generated_recipes.id  (constraint nutrition_plan_meals_generated_recipe_id_fkey)
 - nutrition_plan_prep_tasks.import_id → nutrition_plan_imports.id  (constraint nutrition_plan_prep_tasks_import_id_fkey)
 - nutrition_plan_prep_tasks.meal_plan_slot_id → meal_plan_slots.id  (constraint nutrition_plan_prep_tasks_meal_plan_slot_id_fkey)
 - nutrition_plan_prep_tasks.plan_version_id → meal_plan_versions.id  (constraint nutrition_plan_prep_tasks_plan_version_id_fkey)
 - nutrition_plan_shopping_items.archetype_id → archetypes.id  (constraint nutrition_plan_shopping_items_archetype_id_fkey)
 - nutrition_plan_shopping_items.import_id → nutrition_plan_imports.id  (constraint nutrition_plan_shopping_items_import_id_fkey)
 - nutrition_plan_shopping_items.canonical_food_id → canonical_foods.id  (constraint nutrition_plan_shopping_items_canonical_food_id_fkey)
 - nutrition_plan_shopping_items.plan_version_id → meal_plan_versions.id  (constraint nutrition_plan_shopping_items_plan_version_id_fkey)
 - nutrition_target_versions.member_id → household_members.id  (constraint nutrition_target_versions_member_id_fkey)
 - pantry_items.product_id → products.id  (constraint pantry_items_product_id_fkey)
 - pantry_items.user_id → legacy_users.id  (constraint pantry_items_user_id_fkey)
 - plan_regen_requests.import_id → nutrition_plan_imports.id  (constraint plan_regen_requests_import_id_fkey)
 - planned_meals.recipe_id → recipes.id  (constraint planned_meals_recipe_id_fkey)
 - planned_meals.plan_id → meal_plans.id  (constraint planned_meals_plan_id_fkey)
 - prep_task_dependencies.task_id → nutrition_plan_prep_tasks.id  (constraint prep_task_dependencies_task_id_fkey)
 - prep_task_dependencies.plan_version_id → meal_plan_versions.id  (constraint prep_task_dependencies_plan_version_id_fkey)
 - prep_task_dependencies.depends_on_task_id → nutrition_plan_prep_tasks.id  (constraint prep_task_dependencies_depends_on_task_id_fkey)
 - products.archetype_id → archetypes.id  (constraint products_archetype_fk)
 - recipe_ingredients.canonical_food_id → canonical_foods.id  (constraint recipe_ingredients_canonical_food_id_fkey)
 - recipe_ingredients.sub_recipe_id → recipes.id  (constraint recipe_ingredients_sub_recipe_fk)
 - recipe_ingredients.archetype_id → archetypes.id  (constraint recipe_ingredients_archetype_id_fkey)
 - recipe_ingredients.recipe_id → recipes.id  (constraint recipe_ingredients_recipe_id_fkey)
 - recipe_nutrition_cache.recipe_id → recipes.id  (constraint recipe_nutrition_cache_recipe_id_fkey)
 - recipe_nutrition_snapshots.generated_recipe_id → generated_recipes.id  (constraint recipe_nutrition_snapshots_generated_recipe_id_fkey)
 - recipe_pairings.main_recipe_id → recipes.id  (constraint recipe_pairings_main_recipe_id_fkey)
 - recipe_pairings.side_recipe_id → recipes.id  (constraint recipe_pairings_side_recipe_id_fkey)
 - recipe_steps.recipe_id → recipes.id  (constraint recipe_steps_recipe_id_fkey)
 - recipe_tags.recipe_id → recipes.id  (constraint recipe_tags_recipe_id_fkey)
 - recipe_tags.tag_id → tags.id  (constraint recipe_tags_tag_id_fkey)
 - reference_subcategories.category_id → reference_categories.id  (constraint reference_subcategories_category_id_fkey)
 - seasonality.food_id → canonical_foods.id  (constraint seasonality_food_id_fkey)
 - user_allergies.canonical_food_id → canonical_foods.id  (constraint user_allergies_canonical_food_id_fkey)
 - user_diets.diet_id → diets.id  (constraint user_diets_diet_id_fkey)
 - user_food_bans.canonical_food_id → canonical_foods.id  (constraint user_food_bans_canonical_food_id_fkey)
 - user_health_goals.household_member_id → household_members.id  (constraint user_health_goals_household_member_id_fkey)
 - user_recipe_interactions.recipe_id → recipes.id  (constraint user_recipe_interactions_recipe_id_fkey)
 - user_recipe_interactions.user_id → legacy_users.id  (constraint user_recipe_interactions_user_id_fkey)
 - waste_prevention_log.lot_id → inventory_lots.id  (constraint waste_prevention_log_lot_id_fkey)
 - weight_entries.household_member_id → household_members.id  (constraint weight_entries_household_member_id_fkey)

---
## Index
 - public._backup_views → _backup_views_pkey : CREATE UNIQUE INDEX _backup_views_pkey ON public._backup_views USING btree (view_schema, view_name, dropped_at)
 - public.archetype_nutrition_overrides → archetype_nutrition_overrides_pkey : CREATE UNIQUE INDEX archetype_nutrition_overrides_pkey ON public.archetype_nutrition_overrides USING btree (archetype_id)
 - public.archetype_nutrition_overrides → idx_archetype_nutrition_overrides_nutrition_id : CREATE INDEX idx_archetype_nutrition_overrides_nutrition_id ON public.archetype_nutrition_overrides USING btree (nutrition_id)
 - public.archetypes → archetypes_default_per_canonical : CREATE UNIQUE INDEX archetypes_default_per_canonical ON public.archetypes USING btree (canonical_food_id) WHERE ((is_default IS TRUE) AND (cultivar_id IS NULL))
 - public.archetypes → archetypes_default_per_cultivar : CREATE UNIQUE INDEX archetypes_default_per_cultivar ON public.archetypes USING btree (cultivar_id) WHERE (is_default IS TRUE)
 - public.archetypes → archetypes_pkey : CREATE UNIQUE INDEX archetypes_pkey ON public.archetypes USING btree (id)
 - public.archetypes → idx_archetypes_parent : CREATE INDEX idx_archetypes_parent ON public.archetypes USING btree (canonical_food_id, cultivar_id)
 - public.archetypes → idx_archetypes_process : CREATE INDEX idx_archetypes_process ON public.archetypes USING btree (process)
 - public.canonical_food_origins → canonical_food_origins_pkey : CREATE UNIQUE INDEX canonical_food_origins_pkey ON public.canonical_food_origins USING btree (food_id, country_id)
 - public.canonical_food_processes → canonical_food_processes_pkey : CREATE UNIQUE INDEX canonical_food_processes_pkey ON public.canonical_food_processes USING btree (id)
 - public.canonical_foods → canonical_foods_canonical_name_key : CREATE UNIQUE INDEX canonical_foods_canonical_name_key ON public.canonical_foods USING btree (canonical_name)
 - public.canonical_foods → canonical_foods_pkey : CREATE UNIQUE INDEX canonical_foods_pkey ON public.canonical_foods USING btree (id)
 - public.ciqual_reference → ciqual_reference_pkey : CREATE UNIQUE INDEX ciqual_reference_pkey ON public.ciqual_reference USING btree (alim_code)
 - public.cooked_dish_ingredients → cooked_dish_ingredients_pkey : CREATE UNIQUE INDEX cooked_dish_ingredients_pkey ON public.cooked_dish_ingredients USING btree (id)
 - public.cooked_dish_ingredients → idx_cooked_dish_ingredients_dish_id : CREATE INDEX idx_cooked_dish_ingredients_dish_id ON public.cooked_dish_ingredients USING btree (dish_id)
 - public.cooked_dish_ingredients → idx_cooked_dish_ingredients_lot_id : CREATE INDEX idx_cooked_dish_ingredients_lot_id ON public.cooked_dish_ingredients USING btree (lot_id) WHERE (lot_id IS NOT NULL)
 - public.cooked_dishes → cooked_dishes_pkey : CREATE UNIQUE INDEX cooked_dishes_pkey ON public.cooked_dishes USING btree (id)
 - public.cooked_dishes → idx_cooked_dishes_active : CREATE INDEX idx_cooked_dishes_active ON public.cooked_dishes USING btree (user_id, portions_remaining) WHERE (portions_remaining > (0)::numeric)
 - public.cooked_dishes → idx_cooked_dishes_batch : CREATE INDEX idx_cooked_dishes_batch ON public.cooked_dishes USING btree (batch_recipe_id)
 - public.cooked_dishes → idx_cooked_dishes_expiration : CREATE INDEX idx_cooked_dishes_expiration ON public.cooked_dishes USING btree (expiration_date) WHERE (portions_remaining > (0)::numeric)
 - public.cooked_dishes → idx_cooked_dishes_recipe_id : CREATE INDEX idx_cooked_dishes_recipe_id ON public.cooked_dishes USING btree (recipe_id) WHERE (recipe_id IS NOT NULL)
 - public.cooked_dishes → idx_cooked_dishes_user_id : CREATE INDEX idx_cooked_dishes_user_id ON public.cooked_dishes USING btree (user_id)
 - public.cooking_nutrition_factors → cooking_nutrition_factors_cooking_method_nutrient_name_fact_key : CREATE UNIQUE INDEX cooking_nutrition_factors_cooking_method_nutrient_name_fact_key ON public.cooking_nutrition_factors USING btree (cooking_method, nutrient_name, factor_type)
 - public.cooking_nutrition_factors → cooking_nutrition_factors_pkey : CREATE UNIQUE INDEX cooking_nutrition_factors_pkey ON public.cooking_nutrition_factors USING btree (id)
 - public.cooking_session_ingredients → cooking_session_ingredients_pkey : CREATE UNIQUE INDEX cooking_session_ingredients_pkey ON public.cooking_session_ingredients USING btree (id)
 - public.cooking_session_ingredients → idx_csi_session_id : CREATE INDEX idx_csi_session_id ON public.cooking_session_ingredients USING btree (session_id)
 - public.cooking_sessions → cooking_sessions_pkey : CREATE UNIQUE INDEX cooking_sessions_pkey ON public.cooking_sessions USING btree (id)
 - public.cooking_sessions → idx_cooking_sessions_user_status : CREATE INDEX idx_cooking_sessions_user_status ON public.cooking_sessions USING btree (user_id, status)
 - public.countries → countries_name_key : CREATE UNIQUE INDEX countries_name_key ON public.countries USING btree (name)
 - public.countries → countries_pkey : CREATE UNIQUE INDEX countries_pkey ON public.countries USING btree (id)
 - public.cultivars → cultivars_pkey : CREATE UNIQUE INDEX cultivars_pkey ON public.cultivars USING btree (id)
 - public.cultivars → idx_cultivars_name_ci : CREATE INDEX idx_cultivars_name_ci ON public.cultivars USING btree (lower(cultivar_name))
 - public.cultivars → uq_cultivars_per_species : CREATE UNIQUE INDEX uq_cultivars_per_species ON public.cultivars USING btree (canonical_food_id, lower(cultivar_name))
 - public.data_quality_issues → data_quality_issues_pkey : CREATE UNIQUE INDEX data_quality_issues_pkey ON public.data_quality_issues USING btree (id)
 - public.data_quality_issues → idx_data_quality_plan_version : CREATE INDEX idx_data_quality_plan_version ON public.data_quality_issues USING btree (plan_version_id)
 - public.data_quality_issues → idx_data_quality_user_status : CREATE INDEX idx_data_quality_user_status ON public.data_quality_issues USING btree (user_id, status, created_at DESC)
 - public.decision_audit_log → decision_audit_log_pkey : CREATE UNIQUE INDEX decision_audit_log_pkey ON public.decision_audit_log USING btree (id)
 - public.decision_audit_log → idx_decision_audit_plan_version : CREATE INDEX idx_decision_audit_plan_version ON public.decision_audit_log USING btree (plan_version_id)
 - public.decision_audit_log → idx_decision_audit_user_created : CREATE INDEX idx_decision_audit_user_created ON public.decision_audit_log USING btree (user_id, created_at DESC)
 - public.diets → diets_name_key : CREATE UNIQUE INDEX diets_name_key ON public.diets USING btree (name)
 - public.diets → diets_pkey : CREATE UNIQUE INDEX diets_pkey ON public.diets USING btree (id)
 - public.food_storage_policies → food_storage_policies_archetype_unique : CREATE UNIQUE INDEX food_storage_policies_archetype_unique ON public.food_storage_policies USING btree (archetype_id, food_state, purchase_state, storage_method) WHERE (canonical_food_id IS NULL)
 - public.food_storage_policies → food_storage_policies_canonical_unique : CREATE UNIQUE INDEX food_storage_policies_canonical_unique ON public.food_storage_policies USING btree (canonical_food_id, food_state, purchase_state, storage_method) WHERE (archetype_id IS NULL)
 - public.food_storage_policies → food_storage_policies_lookup_archetype : CREATE INDEX food_storage_policies_lookup_archetype ON public.food_storage_policies USING btree (archetype_id, active) WHERE (archetype_id IS NOT NULL)
 - public.food_storage_policies → food_storage_policies_lookup_canonical : CREATE INDEX food_storage_policies_lookup_canonical ON public.food_storage_policies USING btree (canonical_food_id, active) WHERE (canonical_food_id IS NOT NULL)
 - public.food_storage_policies → food_storage_policies_pkey : CREATE UNIQUE INDEX food_storage_policies_pkey ON public.food_storage_policies USING btree (id)
 - public.generated_recipe_ingredients → generated_recipe_ingredients_pkey : CREATE UNIQUE INDEX generated_recipe_ingredients_pkey ON public.generated_recipe_ingredients USING btree (id)
 - public.generated_recipe_ingredients → idx_gri_archetype : CREATE INDEX idx_gri_archetype ON public.generated_recipe_ingredients USING btree (archetype_id)
 - public.generated_recipe_ingredients → idx_gri_canonical : CREATE INDEX idx_gri_canonical ON public.generated_recipe_ingredients USING btree (canonical_food_id)
 - public.generated_recipe_ingredients → idx_gri_recipe : CREATE INDEX idx_gri_recipe ON public.generated_recipe_ingredients USING btree (generated_recipe_id)
 - public.generated_recipe_ingredients → idx_gri_review_status : CREATE INDEX idx_gri_review_status ON public.generated_recipe_ingredients USING btree (review_status) WHERE (review_status = ANY (ARRAY['pending'::text, 'proposed'::text]))
 - public.generated_recipes → generated_recipes_pkey : CREATE UNIQUE INDEX generated_recipes_pkey ON public.generated_recipes USING btree (id)
 - public.generated_recipes → idx_generated_recipes_name : CREATE INDEX idx_generated_recipes_name ON public.generated_recipes USING btree (user_id, name_normalized)
 - public.household_member_legacy_names → household_member_legacy_names_pkey : CREATE UNIQUE INDEX household_member_legacy_names_pkey ON public.household_member_legacy_names USING btree (id)
 - public.household_member_legacy_names → household_member_legacy_names_user_id_normalized_name_key : CREATE UNIQUE INDEX household_member_legacy_names_user_id_normalized_name_key ON public.household_member_legacy_names USING btree (user_id, normalized_name)
 - public.household_members → household_members_pkey : CREATE UNIQUE INDEX household_members_pkey ON public.household_members USING btree (id)
 - public.household_members → idx_household_members_user_active : CREATE INDEX idx_household_members_user_active ON public.household_members USING btree (user_id, active)
 - public.household_members → uq_household_members_user_name : CREATE UNIQUE INDEX uq_household_members_user_name ON public.household_members USING btree (user_id, lower(name))
 - public.instructions → instructions_pkey : CREATE UNIQUE INDEX instructions_pkey ON public.instructions USING btree (id)
 - public.inventory_lots → idx_inv_archetype : CREATE INDEX idx_inv_archetype ON public.inventory_lots USING btree (archetype_id)
 - public.inventory_lots → idx_inv_canonical : CREATE INDEX idx_inv_canonical ON public.inventory_lots USING btree (canonical_food_id)
 - public.inventory_lots → idx_inv_cultivar : CREATE INDEX idx_inv_cultivar ON public.inventory_lots USING btree (cultivar_id)
 - public.inventory_lots → idx_inv_product : CREATE INDEX idx_inv_product ON public.inventory_lots USING btree (product_id)
 - public.inventory_lots → idx_inventory_lots_adjusted_exp : CREATE INDEX idx_inventory_lots_adjusted_exp ON public.inventory_lots USING btree (adjusted_expiration_date) WHERE (adjusted_expiration_date IS NOT NULL)
 - public.inventory_lots → idx_inventory_lots_containerized : CREATE INDEX idx_inventory_lots_containerized ON public.inventory_lots USING btree (user_id, is_containerized) WHERE (is_containerized = true)
 - public.inventory_lots → idx_inventory_lots_expiration : CREATE INDEX idx_inventory_lots_expiration ON public.inventory_lots USING btree (expiration_date)
 - public.inventory_lots → idx_inventory_lots_is_opened : CREATE INDEX idx_inventory_lots_is_opened ON public.inventory_lots USING btree (is_opened) WHERE (is_opened = true)
 - public.inventory_lots → idx_inventory_lots_storage : CREATE INDEX idx_inventory_lots_storage ON public.inventory_lots USING btree (storage_method)
 - public.inventory_lots → idx_inventory_lots_user_exp : CREATE INDEX idx_inventory_lots_user_exp ON public.inventory_lots USING btree (user_id, expiration_date)
 - public.inventory_lots → idx_inventory_lots_user_id : CREATE INDEX idx_inventory_lots_user_id ON public.inventory_lots USING btree (user_id)
 - public.inventory_lots → inventory_lots_pkey : CREATE UNIQUE INDEX inventory_lots_pkey ON public.inventory_lots USING btree (id)
 - public.inventory_lots → inventory_lots_storage_review_idx : CREATE INDEX inventory_lots_storage_review_idx ON public.inventory_lots USING btree (user_id, acquired_on DESC) WHERE (requires_storage_review = true)
 - public.inventory_movements → idx_inv_mov_lot_id : CREATE INDEX idx_inv_mov_lot_id ON public.inventory_movements USING btree (lot_id) WHERE (lot_id IS NOT NULL)
 - public.inventory_movements → idx_inv_mov_session_id : CREATE INDEX idx_inv_mov_session_id ON public.inventory_movements USING btree (session_id) WHERE (session_id IS NOT NULL)
 - public.inventory_movements → idx_inv_mov_user_created_at : CREATE INDEX idx_inv_mov_user_created_at ON public.inventory_movements USING btree (user_id, created_at DESC)
 - public.inventory_movements → inventory_movements_pkey : CREATE UNIQUE INDEX inventory_movements_pkey ON public.inventory_movements USING btree (id)
 - public.inventory_reservations → idx_inventory_reservations_canonical : CREATE INDEX idx_inventory_reservations_canonical ON public.inventory_reservations USING btree (canonical_food_id)
 - public.inventory_reservations → idx_inventory_reservations_lot_active : CREATE INDEX idx_inventory_reservations_lot_active ON public.inventory_reservations USING btree (lot_id, status) WHERE (status = 'active'::text)
 - public.inventory_reservations → idx_inventory_reservations_slot : CREATE INDEX idx_inventory_reservations_slot ON public.inventory_reservations USING btree (slot_id, status)
 - public.inventory_reservations → idx_inventory_reservations_user : CREATE INDEX idx_inventory_reservations_user ON public.inventory_reservations USING btree (user_id)
 - public.inventory_reservations → idx_inventory_reservations_version : CREATE INDEX idx_inventory_reservations_version ON public.inventory_reservations USING btree (plan_version_id, status)
 - public.inventory_reservations → inventory_reservations_pkey : CREATE UNIQUE INDEX inventory_reservations_pkey ON public.inventory_reservations USING btree (id)
 - public.legacy_users → users_pkey : CREATE UNIQUE INDEX users_pkey ON public.legacy_users USING btree (id)
 - public.legacy_users → users_username_key : CREATE UNIQUE INDEX users_username_key ON public.legacy_users USING btree (username)
 - public.locations → locations_pkey : CREATE UNIQUE INDEX locations_pkey ON public.locations USING btree (id)
 - public.meal_feedback → idx_meal_feedback_actual_recipe : CREATE INDEX idx_meal_feedback_actual_recipe ON public.meal_feedback USING btree (actual_recipe_id)
 - public.meal_feedback → idx_meal_feedback_member : CREATE INDEX idx_meal_feedback_member ON public.meal_feedback USING btree (household_member_id)
 - public.meal_feedback → idx_meal_feedback_plan_version : CREATE INDEX idx_meal_feedback_plan_version ON public.meal_feedback USING btree (plan_version_id)
 - public.meal_feedback → idx_meal_feedback_slot : CREATE INDEX idx_meal_feedback_slot ON public.meal_feedback USING btree (slot_id)
 - public.meal_feedback → idx_meal_feedback_user_created : CREATE INDEX idx_meal_feedback_user_created ON public.meal_feedback USING btree (user_id, created_at DESC)
 - public.meal_feedback → meal_feedback_pkey : CREATE UNIQUE INDEX meal_feedback_pkey ON public.meal_feedback USING btree (id)
 - public.meal_log → idx_meal_log_household_member : CREATE INDEX idx_meal_log_household_member ON public.meal_log USING btree (household_member_id)
 - public.meal_log → idx_meal_log_user_date : CREATE INDEX idx_meal_log_user_date ON public.meal_log USING btree (user_id, person_name, meal_date)
 - public.meal_log → meal_log_pkey : CREATE UNIQUE INDEX meal_log_pkey ON public.meal_log USING btree (id)
 - public.meal_plan_slots → idx_meal_plan_slots_cooked_dish : CREATE INDEX idx_meal_plan_slots_cooked_dish ON public.meal_plan_slots USING btree (cooked_dish_id)
 - public.meal_plan_slots → idx_meal_plan_slots_generated_recipe : CREATE INDEX idx_meal_plan_slots_generated_recipe ON public.meal_plan_slots USING btree (generated_recipe_id)
 - public.meal_plan_slots → idx_meal_plan_slots_user_date : CREATE INDEX idx_meal_plan_slots_user_date ON public.meal_plan_slots USING btree (user_id, meal_date, meal_type)
 - public.meal_plan_slots → idx_meal_plan_slots_version_date : CREATE INDEX idx_meal_plan_slots_version_date ON public.meal_plan_slots USING btree (plan_version_id, meal_date, meal_type)
 - public.meal_plan_slots → meal_plan_slots_pkey : CREATE UNIQUE INDEX meal_plan_slots_pkey ON public.meal_plan_slots USING btree (id)
 - public.meal_plan_slots → meal_plan_slots_plan_version_id_slot_key_key : CREATE UNIQUE INDEX meal_plan_slots_plan_version_id_slot_key_key ON public.meal_plan_slots USING btree (plan_version_id, slot_key)
 - public.meal_plan_validation_issues → idx_plan_issues_slot : CREATE INDEX idx_plan_issues_slot ON public.meal_plan_validation_issues USING btree (slot_id)
 - public.meal_plan_validation_issues → idx_plan_issues_user : CREATE INDEX idx_plan_issues_user ON public.meal_plan_validation_issues USING btree (user_id)
 - public.meal_plan_validation_issues → idx_plan_issues_version_severity : CREATE INDEX idx_plan_issues_version_severity ON public.meal_plan_validation_issues USING btree (plan_version_id, severity)
 - public.meal_plan_validation_issues → meal_plan_validation_issues_pkey : CREATE UNIQUE INDEX meal_plan_validation_issues_pkey ON public.meal_plan_validation_issues USING btree (id)
 - public.meal_plan_versions → idx_meal_plan_versions_import : CREATE INDEX idx_meal_plan_versions_import ON public.meal_plan_versions USING btree (import_id, version_no DESC)
 - public.meal_plan_versions → idx_meal_plan_versions_user_status : CREATE INDEX idx_meal_plan_versions_user_status ON public.meal_plan_versions USING btree (user_id, status, window_start DESC)
 - public.meal_plan_versions → meal_plan_versions_import_id_version_no_key : CREATE UNIQUE INDEX meal_plan_versions_import_id_version_no_key ON public.meal_plan_versions USING btree (import_id, version_no)
 - public.meal_plan_versions → meal_plan_versions_pkey : CREATE UNIQUE INDEX meal_plan_versions_pkey ON public.meal_plan_versions USING btree (id)
 - public.meal_plan_versions → uq_meal_plan_one_published : CREATE UNIQUE INDEX uq_meal_plan_one_published ON public.meal_plan_versions USING btree (import_id) WHERE (status = 'published'::text)
 - public.meal_plans → meal_plans_pkey : CREATE UNIQUE INDEX meal_plans_pkey ON public.meal_plans USING btree (id)
 - public.meal_stock_deductions → idx_msd_lot_id : CREATE INDEX idx_msd_lot_id ON public.meal_stock_deductions USING btree (lot_id) WHERE (lot_id IS NOT NULL)
 - public.meal_stock_deductions → idx_msd_user_meal : CREATE INDEX idx_msd_user_meal ON public.meal_stock_deductions USING btree (user_id, meal_date, meal_type)
 - public.meal_stock_deductions → meal_stock_deductions_pkey : CREATE UNIQUE INDEX meal_stock_deductions_pkey ON public.meal_stock_deductions USING btree (id)
 - public.nutrition_plan_batch_recipes → idx_batch_recipes_cook_date : CREATE INDEX idx_batch_recipes_cook_date ON public.nutrition_plan_batch_recipes USING btree (import_id, cook_date)
 - public.nutrition_plan_batch_recipes → nutrition_plan_batch_recipes_pkey : CREATE UNIQUE INDEX nutrition_plan_batch_recipes_pkey ON public.nutrition_plan_batch_recipes USING btree (id)
 - public.nutrition_plan_daily_totals → nutrition_plan_daily_totals_import_id_person_name_meal_date_key : CREATE UNIQUE INDEX nutrition_plan_daily_totals_import_id_person_name_meal_date_key ON public.nutrition_plan_daily_totals USING btree (import_id, person_name, meal_date)
 - public.nutrition_plan_daily_totals → nutrition_plan_daily_totals_pkey : CREATE UNIQUE INDEX nutrition_plan_daily_totals_pkey ON public.nutrition_plan_daily_totals USING btree (id)
 - public.nutrition_plan_imports → idx_npi_user : CREATE INDEX idx_npi_user ON public.nutrition_plan_imports USING btree (user_id)
 - public.nutrition_plan_imports → nutrition_plan_imports_pkey : CREATE UNIQUE INDEX nutrition_plan_imports_pkey ON public.nutrition_plan_imports USING btree (id)
 - public.nutrition_plan_meals → idx_meals_batch_recipe : CREATE INDEX idx_meals_batch_recipe ON public.nutrition_plan_meals USING btree (batch_recipe_id)
 - public.nutrition_plan_meals → idx_npm_generated_recipe_id : CREATE INDEX idx_npm_generated_recipe_id ON public.nutrition_plan_meals USING btree (generated_recipe_id) WHERE (generated_recipe_id IS NOT NULL)
 - public.nutrition_plan_meals → idx_npm_import_date : CREATE INDEX idx_npm_import_date ON public.nutrition_plan_meals USING btree (import_id, meal_date)
 - public.nutrition_plan_meals → idx_npm_person_date : CREATE INDEX idx_npm_person_date ON public.nutrition_plan_meals USING btree (person_name, meal_date)
 - public.nutrition_plan_meals → idx_nutrition_plan_meals_household_member : CREATE INDEX idx_nutrition_plan_meals_household_member ON public.nutrition_plan_meals USING btree (household_member_id)
 - public.nutrition_plan_meals → idx_nutrition_plan_meals_slot : CREATE INDEX idx_nutrition_plan_meals_slot ON public.nutrition_plan_meals USING btree (meal_plan_slot_id) WHERE (meal_plan_slot_id IS NOT NULL)
 - public.nutrition_plan_meals → nutrition_plan_meals_import_id_person_name_meal_date_meal_t_key : CREATE UNIQUE INDEX nutrition_plan_meals_import_id_person_name_meal_date_meal_t_key ON public.nutrition_plan_meals USING btree (import_id, person_name, meal_date, meal_type)
 - public.nutrition_plan_meals → nutrition_plan_meals_pkey : CREATE UNIQUE INDEX nutrition_plan_meals_pkey ON public.nutrition_plan_meals USING btree (id)
 - public.nutrition_plan_prep_tasks → idx_nppt_import_date : CREATE INDEX idx_nppt_import_date ON public.nutrition_plan_prep_tasks USING btree (import_id, prep_date)
 - public.nutrition_plan_prep_tasks → idx_prep_tasks_plan_due : CREATE INDEX idx_prep_tasks_plan_due ON public.nutrition_plan_prep_tasks USING btree (plan_version_id, due_at, workflow_status)
 - public.nutrition_plan_prep_tasks → idx_prep_tasks_slot : CREATE INDEX idx_prep_tasks_slot ON public.nutrition_plan_prep_tasks USING btree (meal_plan_slot_id)
 - public.nutrition_plan_prep_tasks → nutrition_plan_prep_tasks_pkey : CREATE UNIQUE INDEX nutrition_plan_prep_tasks_pkey ON public.nutrition_plan_prep_tasks USING btree (id)
 - public.nutrition_plan_prep_tasks → uq_prep_tasks_version_stable_key : CREATE UNIQUE INDEX uq_prep_tasks_version_stable_key ON public.nutrition_plan_prep_tasks USING btree (plan_version_id, stable_key) WHERE ((plan_version_id IS NOT NULL) AND (stable_key IS NOT NULL))
 - public.nutrition_plan_shopping_items → idx_npsi_archetype : CREATE INDEX idx_npsi_archetype ON public.nutrition_plan_shopping_items USING btree (archetype_id) WHERE (archetype_id IS NOT NULL)
 - public.nutrition_plan_shopping_items → idx_npsi_canonical_food : CREATE INDEX idx_npsi_canonical_food ON public.nutrition_plan_shopping_items USING btree (canonical_food_id) WHERE (canonical_food_id IS NOT NULL)
 - public.nutrition_plan_shopping_items → idx_npsi_import_week : CREATE INDEX idx_npsi_import_week ON public.nutrition_plan_shopping_items USING btree (import_id, week_label)
 - public.nutrition_plan_shopping_items → idx_npsi_review_status : CREATE INDEX idx_npsi_review_status ON public.nutrition_plan_shopping_items USING btree (review_status) WHERE (review_status = ANY (ARRAY['pending'::text, 'proposed'::text]))
 - public.nutrition_plan_shopping_items → idx_shopping_items_plan_status : CREATE INDEX idx_shopping_items_plan_status ON public.nutrition_plan_shopping_items USING btree (plan_version_id, shopping_status, aisle_order)
 - public.nutrition_plan_shopping_items → nutrition_plan_shopping_items_pkey : CREATE UNIQUE INDEX nutrition_plan_shopping_items_pkey ON public.nutrition_plan_shopping_items USING btree (id)
 - public.nutrition_target_versions → idx_nutrition_targets_member_dates : CREATE INDEX idx_nutrition_targets_member_dates ON public.nutrition_target_versions USING btree (member_id, effective_from DESC, effective_to)
 - public.nutrition_target_versions → idx_nutrition_targets_user : CREATE INDEX idx_nutrition_targets_user ON public.nutrition_target_versions USING btree (user_id)
 - public.nutrition_target_versions → nutrition_target_versions_pkey : CREATE UNIQUE INDEX nutrition_target_versions_pkey ON public.nutrition_target_versions USING btree (id)
 - public.nutrition_target_versions → uq_nutrition_targets_member_active : CREATE UNIQUE INDEX uq_nutrition_targets_member_active ON public.nutrition_target_versions USING btree (member_id) WHERE (effective_to IS NULL)
 - public.nutrition_target_versions → uq_nutrition_targets_member_day : CREATE UNIQUE INDEX uq_nutrition_targets_member_day ON public.nutrition_target_versions USING btree (member_id, effective_from)
 - public.nutritional_data → nutritional_data_pkey : CREATE UNIQUE INDEX nutritional_data_pkey ON public.nutritional_data USING btree (id)
 - public.nutritional_data → nutritional_data_source_id_key : CREATE UNIQUE INDEX nutritional_data_source_id_key ON public.nutritional_data USING btree (source_id)
 - public.pantry_items → pantry_items_pkey : CREATE UNIQUE INDEX pantry_items_pkey ON public.pantry_items USING btree (id)
 - public.plan_regen_requests → idx_plan_regen_requests_user_status : CREATE INDEX idx_plan_regen_requests_user_status ON public.plan_regen_requests USING btree (user_id, status, created_at)
 - public.plan_regen_requests → plan_regen_requests_pkey : CREATE UNIQUE INDEX plan_regen_requests_pkey ON public.plan_regen_requests USING btree (id)
 - public.planned_meals → planned_meals_pkey : CREATE UNIQUE INDEX planned_meals_pkey ON public.planned_meals USING btree (id)
 - public.prep_task_dependencies → idx_prep_dependencies_depends_on : CREATE INDEX idx_prep_dependencies_depends_on ON public.prep_task_dependencies USING btree (depends_on_task_id)
 - public.prep_task_dependencies → idx_prep_dependencies_plan_version : CREATE INDEX idx_prep_dependencies_plan_version ON public.prep_task_dependencies USING btree (plan_version_id)
 - public.prep_task_dependencies → idx_prep_dependencies_task : CREATE INDEX idx_prep_dependencies_task ON public.prep_task_dependencies USING btree (task_id, depends_on_task_id)
 - public.prep_task_dependencies → idx_prep_dependencies_user : CREATE INDEX idx_prep_dependencies_user ON public.prep_task_dependencies USING btree (user_id)
 - public.prep_task_dependencies → prep_task_dependencies_pkey : CREATE UNIQUE INDEX prep_task_dependencies_pkey ON public.prep_task_dependencies USING btree (id)
 - public.prep_task_dependencies → prep_task_dependencies_task_id_depends_on_task_id_key : CREATE UNIQUE INDEX prep_task_dependencies_task_id_depends_on_task_id_key ON public.prep_task_dependencies USING btree (task_id, depends_on_task_id)
 - public.process_nutrition_modifiers → idx_process_nutrition_modifiers_category : CREATE INDEX idx_process_nutrition_modifiers_category ON public.process_nutrition_modifiers USING btree (category)
 - public.process_nutrition_modifiers → idx_process_nutrition_modifiers_nutrient : CREATE INDEX idx_process_nutrition_modifiers_nutrient ON public.process_nutrition_modifiers USING btree (nutrient_name)
 - public.process_nutrition_modifiers → idx_process_nutrition_modifiers_pattern : CREATE INDEX idx_process_nutrition_modifiers_pattern ON public.process_nutrition_modifiers USING btree (process_pattern)
 - public.process_nutrition_modifiers → process_nutrition_modifiers_pkey : CREATE UNIQUE INDEX process_nutrition_modifiers_pkey ON public.process_nutrition_modifiers USING btree (id)
 - public.process_nutrition_modifiers → unique_pattern_nutrient : CREATE UNIQUE INDEX unique_pattern_nutrient ON public.process_nutrition_modifiers USING btree (process_pattern, nutrient_name)
 - public.processes → processes_name_key : CREATE UNIQUE INDEX processes_name_key ON public.processes USING btree (name)
 - public.processes → processes_pkey : CREATE UNIQUE INDEX processes_pkey ON public.processes USING btree (id)
 - public.products → idx_products_archetype : CREATE INDEX idx_products_archetype ON public.products USING btree (archetype_id)
 - public.products → idx_products_brand : CREATE INDEX idx_products_brand ON public.products USING btree (brand)
 - public.products → products_default_per_archetype : CREATE UNIQUE INDEX products_default_per_archetype ON public.products USING btree (archetype_id) WHERE (is_default IS TRUE)
 - public.products → products_ean_key : CREATE UNIQUE INDEX products_ean_key ON public.products USING btree (ean)
 - public.products → products_pkey : CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id)
 - public.recipe_ingredients → idx_recipe_ingredients_archetype : CREATE INDEX idx_recipe_ingredients_archetype ON public.recipe_ingredients USING btree (archetype_id)
 - public.recipe_ingredients → idx_recipe_ingredients_canonical : CREATE INDEX idx_recipe_ingredients_canonical ON public.recipe_ingredients USING btree (canonical_food_id)
 - public.recipe_ingredients → idx_recipe_ingredients_cfid_arid : CREATE INDEX idx_recipe_ingredients_cfid_arid ON public.recipe_ingredients USING btree (canonical_food_id, archetype_id)
 - public.recipe_ingredients → idx_recipe_ingredients_recipe_id : CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients USING btree (recipe_id)
 - public.recipe_ingredients → idx_recipe_ingredients_sub : CREATE INDEX idx_recipe_ingredients_sub ON public.recipe_ingredients USING btree (sub_recipe_id)
 - public.recipe_ingredients → recipe_ingredients_pkey : CREATE UNIQUE INDEX recipe_ingredients_pkey ON public.recipe_ingredients USING btree (id)
 - public.recipe_ingredients → uq_recipe_ingredients_unique_line_idx : CREATE UNIQUE INDEX uq_recipe_ingredients_unique_line_idx ON public.recipe_ingredients USING btree (recipe_id, COALESCE(canonical_food_id, ('-1'::integer)::bigint), COALESCE(archetype_id, ('-1'::integer)::bigint), COALESCE(unit, ''::character varying), COALESCE(notes, ''::text))
 - public.recipe_nutrition_cache → idx_recipe_nutrition_cache_calculated : CREATE INDEX idx_recipe_nutrition_cache_calculated ON public.recipe_nutrition_cache USING btree (calculated_at)
 - public.recipe_nutrition_cache → recipe_nutrition_cache_pkey : CREATE UNIQUE INDEX recipe_nutrition_cache_pkey ON public.recipe_nutrition_cache USING btree (recipe_id)
 - public.recipe_nutrition_snapshots → idx_recipe_nutrition_latest : CREATE INDEX idx_recipe_nutrition_latest ON public.recipe_nutrition_snapshots USING btree (generated_recipe_id, version_no DESC)
 - public.recipe_nutrition_snapshots → idx_recipe_nutrition_user : CREATE INDEX idx_recipe_nutrition_user ON public.recipe_nutrition_snapshots USING btree (user_id)
 - public.recipe_nutrition_snapshots → recipe_nutrition_snapshots_generated_recipe_id_version_no_key : CREATE UNIQUE INDEX recipe_nutrition_snapshots_generated_recipe_id_version_no_key ON public.recipe_nutrition_snapshots USING btree (generated_recipe_id, version_no)
 - public.recipe_nutrition_snapshots → recipe_nutrition_snapshots_pkey : CREATE UNIQUE INDEX recipe_nutrition_snapshots_pkey ON public.recipe_nutrition_snapshots USING btree (id)
 - public.recipe_pairings → recipe_pairings_pkey : CREATE UNIQUE INDEX recipe_pairings_pkey ON public.recipe_pairings USING btree (main_recipe_id, side_recipe_id)
 - public.recipe_steps → idx_recipe_steps_recipe : CREATE INDEX idx_recipe_steps_recipe ON public.recipe_steps USING btree (recipe_id)
 - public.recipe_steps → recipe_steps_pkey : CREATE UNIQUE INDEX recipe_steps_pkey ON public.recipe_steps USING btree (id)
 - public.recipe_tags → recipe_tags_pkey : CREATE UNIQUE INDEX recipe_tags_pkey ON public.recipe_tags USING btree (recipe_id, tag_id)
 - public.recipes → recipes_name_unique : CREATE UNIQUE INDEX recipes_name_unique ON public.recipes USING btree (name)
 - public.recipes → recipes_pkey : CREATE UNIQUE INDEX recipes_pkey ON public.recipes USING btree (id)
 - public.reference_categories → reference_categories_name_key : CREATE UNIQUE INDEX reference_categories_name_key ON public.reference_categories USING btree (name)
 - public.reference_categories → reference_categories_pkey : CREATE UNIQUE INDEX reference_categories_pkey ON public.reference_categories USING btree (id)
 - public.reference_subcategories → idx_unique_subcat_code : CREATE UNIQUE INDEX idx_unique_subcat_code ON public.reference_subcategories USING btree (category_id, lower(code))
 - public.reference_subcategories → idx_unique_subcat_label : CREATE UNIQUE INDEX idx_unique_subcat_label ON public.reference_subcategories USING btree (category_id, lower(label))
 - public.reference_subcategories → reference_subcategories_code_key : CREATE UNIQUE INDEX reference_subcategories_code_key ON public.reference_subcategories USING btree (code)
 - public.reference_subcategories → reference_subcategories_pkey : CREATE UNIQUE INDEX reference_subcategories_pkey ON public.reference_subcategories USING btree (id)
 - public.seasonality → seasonality_pkey : CREATE UNIQUE INDEX seasonality_pkey ON public.seasonality USING btree (id)
 - public.tags → tags_name_key : CREATE UNIQUE INDEX tags_name_key ON public.tags USING btree (name)
 - public.tags → tags_pkey : CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id)
 - public.unit_conversions_generic → idx_unit_conv_generic_norm : CREATE UNIQUE INDEX idx_unit_conv_generic_norm ON public.unit_conversions_generic USING btree (lower(from_unit), lower(to_unit))
 - public.unit_conversions_generic → unit_conversions_generic_pkey : CREATE UNIQUE INDEX unit_conversions_generic_pkey ON public.unit_conversions_generic USING btree (id)
 - public.unit_conversions_product → idx_unit_conv_product_norm : CREATE UNIQUE INDEX idx_unit_conv_product_norm ON public.unit_conversions_product USING btree (product_id, lower(from_unit), lower(to_unit))
 - public.unit_conversions_product → unit_conversions_product_pkey : CREATE UNIQUE INDEX unit_conversions_product_pkey ON public.unit_conversions_product USING btree (id)
 - public.user_allergies → user_allergies_pkey : CREATE UNIQUE INDEX user_allergies_pkey ON public.user_allergies USING btree (user_id, canonical_food_id)
 - public.user_diets → user_diets_pkey : CREATE UNIQUE INDEX user_diets_pkey ON public.user_diets USING btree (user_id, diet_id)
 - public.user_food_bans → idx_user_food_bans_user_id : CREATE INDEX idx_user_food_bans_user_id ON public.user_food_bans USING btree (user_id)
 - public.user_food_bans → user_food_bans_pkey : CREATE UNIQUE INDEX user_food_bans_pkey ON public.user_food_bans USING btree (id)
 - public.user_health_goals → user_health_goals_pkey : CREATE UNIQUE INDEX user_health_goals_pkey ON public.user_health_goals USING btree (user_id, person_name)
 - public.user_profiles → user_profiles_pkey : CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (user_id)
 - public.user_recipe_interactions → user_recipe_interactions_pkey : CREATE UNIQUE INDEX user_recipe_interactions_pkey ON public.user_recipe_interactions USING btree (id)
 - public.user_recipe_interactions → user_recipe_interactions_user_id_recipe_id_key : CREATE UNIQUE INDEX user_recipe_interactions_user_id_recipe_id_key ON public.user_recipe_interactions USING btree (user_id, recipe_id)
 - public.waste_prevention_log → idx_wpl_lot_id : CREATE INDEX idx_wpl_lot_id ON public.waste_prevention_log USING btree (lot_id) WHERE (lot_id IS NOT NULL)
 - public.waste_prevention_log → idx_wpl_user_created_at : CREATE INDEX idx_wpl_user_created_at ON public.waste_prevention_log USING btree (user_id, created_at DESC)
 - public.waste_prevention_log → idx_wpl_user_id : CREATE INDEX idx_wpl_user_id ON public.waste_prevention_log USING btree (user_id)
 - public.waste_prevention_log → waste_prevention_log_pkey : CREATE UNIQUE INDEX waste_prevention_log_pkey ON public.waste_prevention_log USING btree (id)
 - public.weight_entries → idx_weight_entries_user_person_date : CREATE INDEX idx_weight_entries_user_person_date ON public.weight_entries USING btree (user_id, person_name, date DESC)
 - public.weight_entries → weight_entries_pkey : CREATE UNIQUE INDEX weight_entries_pkey ON public.weight_entries USING btree (id)
 - public.weight_entries → weight_entries_user_id_person_name_date_key : CREATE UNIQUE INDEX weight_entries_user_id_person_name_date_key ON public.weight_entries USING btree (user_id, person_name, date)

---
## Contraintes CHECK
 - archetypes_expiry_kind_check ON archetypes : CHECK ((expiry_kind = ANY (ARRAY['DLC'::text, 'DDM'::text, 'ESTIMATE'::text])))
 - archetypes_origin_oneof_chk ON archetypes : CHECK (((canonical_food_id IS NOT NULL) OR (cultivar_id IS NOT NULL)))
 - chk_archetype_parent ON archetypes : CHECK ((((canonical_food_id IS NOT NULL) AND (cultivar_id IS NULL)) OR ((canonical_food_id IS NULL) AND (cultivar_id IS NOT NULL))))
 - canonical_foods_source_check ON canonical_foods : CHECK ((source = ANY (ARRAY['curated'::text, 'auto'::text, 'ai'::text])))
 - cooked_dish_ingredients_quantity_used_check ON cooked_dish_ingredients : CHECK ((quantity_used > (0)::numeric))
 - cooked_dishes_at_most_one_recipe_source ON cooked_dishes : CHECK ((NOT ((recipe_id IS NOT NULL) AND (generated_recipe_id IS NOT NULL)))) NOT VALID
 - cooked_dishes_check ON cooked_dishes : CHECK (((portions_remaining >= (0)::numeric) AND (portions_remaining <= portions_cooked)))
 - cooked_dishes_portions_cooked_check ON cooked_dishes : CHECK ((portions_cooked > (0)::numeric))
 - cooked_dishes_storage_method_check ON cooked_dishes : CHECK ((storage_method = ANY (ARRAY['fridge'::text, 'freezer'::text, 'counter'::text])))
 - cooking_session_ingredients_actual_action_check ON cooking_session_ingredients : CHECK ((actual_action = ANY (ARRAY['used'::text, 'substituted'::text, 'skipped'::text, 'extra'::text])))
 - cooking_session_ingredients_source_check ON cooking_session_ingredients : CHECK ((source = ANY (ARRAY['inventory'::text, 'external'::text])))
 - cooking_sessions_recipe_source_check ON cooking_sessions : CHECK ((recipe_source = ANY (ARRAY['curated'::text, 'ai'::text, 'libre'::text])))
 - cooking_sessions_status_check ON cooking_sessions : CHECK ((status = ANY (ARRAY['draft'::text, 'committed'::text, 'undone'::text])))
 - data_quality_issues_severity_check ON data_quality_issues : CHECK ((severity = ANY (ARRAY['error'::text, 'warning'::text, 'info'::text])))
 - data_quality_issues_status_check ON data_quality_issues : CHECK ((status = ANY (ARRAY['open'::text, 'ignored'::text, 'resolved'::text])))
 - food_storage_policies_confidence ON food_storage_policies : CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric)))
 - food_storage_policies_duration ON food_storage_policies : CHECK ((((suitability = 'forbidden'::text) AND (duration_days IS NULL)) OR ((suitability <> 'forbidden'::text) AND ((duration_days IS NULL) OR (duration_days > 0)))))
 - food_storage_policies_expiry_kind ON food_storage_policies : CHECK ((expiry_kind = ANY (ARRAY['DLC'::text, 'DDM'::text, 'estimate'::text, 'unknown'::text])))
 - food_storage_policies_food_state ON food_storage_policies : CHECK ((food_state = ANY (ARRAY['any'::text, 'raw'::text, 'cooked'::text, 'opened'::text, 'thawed'::text])))
 - food_storage_policies_method ON food_storage_policies : CHECK ((storage_method = ANY (ARRAY['pantry'::text, 'fridge'::text, 'freezer'::text])))
 - food_storage_policies_one_entity ON food_storage_policies : CHECK ((num_nonnulls(canonical_food_id, archetype_id) = 1))
 - food_storage_policies_purchase_state ON food_storage_policies : CHECK ((purchase_state = ANY (ARRAY['any'::text, 'unknown'::text, 'ambient'::text, 'chilled'::text, 'frozen'::text])))
 - food_storage_policies_suitability ON food_storage_policies : CHECK ((suitability = ANY (ARRAY['recommended'::text, 'allowed'::text, 'forbidden'::text, 'unknown'::text])))
 - food_storage_policies_temperature ON food_storage_policies : CHECK (((min_temperature_c IS NULL) OR (max_temperature_c IS NULL) OR (min_temperature_c <= max_temperature_c)))
 - gri_not_both_entities ON generated_recipe_ingredients : CHECK ((NOT ((canonical_food_id IS NOT NULL) AND (archetype_id IS NOT NULL))))
 - gri_review_status_check ON generated_recipe_ingredients : CHECK ((review_status = ANY (ARRAY['auto'::text, 'proposed'::text, 'pending'::text, 'confirmed'::text])))
 - generated_recipes_rating_check ON generated_recipes : CHECK (((rating >= 1) AND (rating <= 5)))
 - generated_recipes_status_check ON generated_recipes : CHECK ((status = ANY (ARRAY['ready'::text, 'needs_review'::text, 'error'::text])))
 - household_members_member_type_check ON household_members : CHECK ((member_type = ANY (ARRAY['adult'::text, 'child'::text, 'guest'::text])))
 - household_members_name_check ON household_members : CHECK (((char_length(TRIM(BOTH FROM name)) >= 1) AND (char_length(TRIM(BOTH FROM name)) <= 80)))
 - household_members_portion_multiplier_check ON household_members : CHECK (((portion_multiplier > (0)::numeric) AND (portion_multiplier <= (5)::numeric)))
 - inventory_lots_expiration_kind_check ON inventory_lots : CHECK ((expiration_kind = ANY (ARRAY['DLC'::text, 'DDM'::text, 'estimate'::text, 'unknown'::text])))
 - inventory_lots_one_of ON inventory_lots : CHECK (((((((canonical_food_id IS NOT NULL))::integer + ((cultivar_id IS NOT NULL))::integer) + ((archetype_id IS NOT NULL))::integer) + ((product_id IS NOT NULL))::integer) = 1))
 - inventory_lots_storage_confidence_check ON inventory_lots : CHECK (((storage_decision_confidence IS NULL) OR ((storage_decision_confidence >= (0)::numeric) AND (storage_decision_confidence <= (1)::numeric))))
 - inventory_lots_storage_method_check ON inventory_lots : CHECK (((storage_method)::text = ANY ((ARRAY['pantry'::character varying, 'fridge'::character varying, 'freezer'::character varying])::text[])))
 - inventory_movements_movement_type_check ON inventory_movements : CHECK ((movement_type = ANY (ARRAY['purchase'::text, 'consumption'::text, 'correction'::text, 'restore'::text, 'waste'::text])))
 - inventory_reservations_reserved_quantity_check ON inventory_reservations : CHECK ((reserved_quantity > (0)::numeric))
 - inventory_reservations_status_check ON inventory_reservations : CHECK ((status = ANY (ARRAY['active'::text, 'consumed'::text, 'released'::text, 'expired'::text])))
 - meal_feedback_adherence_check ON meal_feedback : CHECK ((adherence = ANY (ARRAY['planned'::text, 'substituted'::text, 'skipped'::text, 'improvised'::text, 'leftover'::text])))
 - meal_feedback_rating_check ON meal_feedback : CHECK (((rating >= 1) AND (rating <= 5)))
 - meal_log_meal_type_check ON meal_log : CHECK ((meal_type = ANY (ARRAY['pdj'::text, 'dejeuner'::text, 'diner'::text, 'collation'::text])))
 - meal_plan_slots_meal_type_check ON meal_plan_slots : CHECK ((meal_type = ANY (ARRAY['pdj'::text, 'dejeuner'::text, 'diner'::text, 'collation'::text])))
 - meal_plan_slots_servings_check ON meal_plan_slots : CHECK ((servings > (0)::numeric))
 - meal_plan_slots_status_check ON meal_plan_slots : CHECK ((status = ANY (ARRAY['planned'::text, 'in_progress'::text, 'completed'::text, 'substituted'::text, 'skipped'::text])))
 - meal_plan_validation_issues_severity_check ON meal_plan_validation_issues : CHECK ((severity = ANY (ARRAY['blocker'::text, 'error'::text, 'warning'::text, 'info'::text])))
 - meal_plan_versions_check ON meal_plan_versions : CHECK ((window_end >= window_start))
 - meal_plan_versions_status_check ON meal_plan_versions : CHECK ((status = ANY (ARRAY['draft'::text, 'review_required'::text, 'published'::text, 'superseded'::text, 'archived'::text])))
 - meal_plan_versions_version_no_check ON meal_plan_versions : CHECK ((version_no > 0))
 - meal_stock_deductions_qty_deducted_check ON meal_stock_deductions : CHECK ((qty_deducted > (0)::numeric))
 - nutrition_plan_meals_meal_type_check ON nutrition_plan_meals : CHECK ((meal_type = ANY (ARRAY['pdj'::text, 'dejeuner'::text, 'diner'::text, 'collation'::text])))
 - npsi_review_status_check ON nutrition_plan_shopping_items : CHECK ((review_status = ANY (ARRAY['auto'::text, 'proposed'::text, 'pending'::text, 'confirmed'::text])))
 - nutrition_target_versions_check ON nutrition_target_versions : CHECK (((effective_to IS NULL) OR (effective_to >= effective_from)))
 - nutrition_target_versions_target_carbs_g_check ON nutrition_target_versions : CHECK (((target_carbs_g IS NULL) OR (target_carbs_g >= (0)::numeric)))
 - nutrition_target_versions_target_fat_g_check ON nutrition_target_versions : CHECK (((target_fat_g IS NULL) OR (target_fat_g >= (0)::numeric)))
 - nutrition_target_versions_target_fiber_g_check ON nutrition_target_versions : CHECK (((target_fiber_g IS NULL) OR (target_fiber_g >= (0)::numeric)))
 - nutrition_target_versions_target_kcal_check ON nutrition_target_versions : CHECK (((target_kcal IS NULL) OR (target_kcal > (0)::numeric)))
 - nutrition_target_versions_target_protein_g_check ON nutrition_target_versions : CHECK (((target_protein_g IS NULL) OR (target_protein_g >= (0)::numeric)))
 - nutrition_target_versions_tolerance_percent_check ON nutrition_target_versions : CHECK (((tolerance_percent >= (0)::numeric) AND (tolerance_percent <= (50)::numeric)))
 - plan_regen_requests_status_check ON plan_regen_requests : CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'done'::text, 'error'::text])))
 - prep_task_dependencies_check ON prep_task_dependencies : CHECK ((task_id <> depends_on_task_id))
 - process_nutrition_modifiers_category_check ON process_nutrition_modifiers : CHECK ((category = ANY (ARRAY['DRYING'::text, 'CONCENTRATION'::text, 'FERMENTATION'::text, 'AGING'::text, 'MECHANICAL'::text, 'PRESERVATION'::text, 'FAT_SEPARATION'::text])))
 - process_nutrition_modifiers_factor_type_check ON process_nutrition_modifiers : CHECK ((factor_type = ANY (ARRAY['RETENTION'::text, 'MULTIPLICATION'::text, 'CONCENTRATION'::text])))
 - process_nutrition_modifiers_factor_value_check ON process_nutrition_modifiers : CHECK ((factor_value >= (0)::numeric))
 - chk_ingredient_source ON recipe_ingredients : CHECK ((((archetype_id IS NOT NULL) AND (canonical_food_id IS NULL)) OR ((archetype_id IS NULL) AND (canonical_food_id IS NOT NULL))))
 - recipe_ing_oneof_exactly_one ON recipe_ingredients : CHECK ((((((canonical_food_id IS NOT NULL))::integer + ((archetype_id IS NOT NULL))::integer) + ((sub_recipe_id IS NOT NULL))::integer) = 1))
 - reference_categories_typical_storage_check ON reference_categories : CHECK ((typical_storage = ANY (ARRAY['fridge'::text, 'pantry'::text, 'freezer'::text, 'cellar'::text, 'varied'::text])))
 - user_food_bans_kind_check ON user_food_bans : CHECK ((kind = ANY (ARRAY['ban'::text, 'dislike'::text])))

---
## Vues
 - archetypes_shelf_life
 - cooked_dishes_active
 - cooked_dishes_stats
 - inventory_available_lots_v2
 - inventory_lots_effective
 - inventory_lots_resolved
 - inventory_lots_with_effective_dlc
 - pantry_view
 - unit_conversions
 - v_expiring_archetypes
 - view_canonical_with_categories

---
## Définition des vues

### archetypes_shelf_life
```sql
 SELECT id,
    name,
    canonical_food_id,
    process,
    COALESCE(shelf_life_days_pantry, shelf_life_days) AS shelf_life_pantry,
    COALESCE(shelf_life_days_fridge, shelf_life_days) AS shelf_life_fridge,
    COALESCE(shelf_life_days_freezer, (shelf_life_days * 10)) AS shelf_life_freezer,
    COALESCE(open_shelf_life_days_pantry, open_shelf_life_days) AS open_shelf_life_pantry,
    COALESCE(open_shelf_life_days_fridge, open_shelf_life_days) AS open_shelf_life_fridge,
    COALESCE(open_shelf_life_days_freezer, (open_shelf_life_days * 10)) AS open_shelf_life_freezer
   FROM archetypes a;
```


### cooked_dishes_active
```sql
 SELECT cd.id,
    cd.user_id,
    cd.name,
    cd.recipe_id,
    cd.portions_cooked,
    cd.portions_remaining,
    cd.storage_method,
    cd.cooked_at,
    cd.expiration_date,
    cd.consumed_completely_at,
    cd.notes,
    cd.created_at,
    cd.updated_at,
    (cd.expiration_date - CURRENT_DATE) AS days_until_expiration,
    r.name AS recipe_name,
    count(cdi.id) AS ingredients_count
   FROM ((cooked_dishes cd
     LEFT JOIN recipes r ON ((cd.recipe_id = r.id)))
     LEFT JOIN cooked_dish_ingredients cdi ON ((cd.id = cdi.dish_id)))
  WHERE (cd.portions_remaining > (0)::numeric)
  GROUP BY cd.id, r.name
  ORDER BY cd.expiration_date;
```


### cooked_dishes_stats
```sql
 SELECT user_id,
    count(*) AS total_dishes_cooked,
    count(*) FILTER (WHERE (portions_remaining > (0)::numeric)) AS dishes_with_leftovers,
    count(*) FILTER (WHERE (portions_remaining = (0)::numeric)) AS dishes_fully_consumed,
    sum(portions_cooked) AS total_portions_cooked,
    sum(portions_remaining) AS total_portions_remaining,
    sum((portions_cooked - portions_remaining)) AS total_portions_consumed,
    round(((100.0 * sum((portions_cooked - portions_remaining))) / NULLIF(sum(portions_cooked), (0)::numeric)), 2) AS consumption_rate_percent
   FROM cooked_dishes
  GROUP BY user_id;
```


### inventory_available_lots_v2
```sql
 SELECT l.id,
    l.user_id,
    l.product_id,
    l.canonical_food_id,
    l.archetype_id,
    l.cultivar_id,
    l.qty_remaining AS physical_quantity,
    COALESCE(r.reserved_quantity, (0)::numeric) AS reserved_quantity,
    GREATEST((l.qty_remaining - COALESCE(r.reserved_quantity, (0)::numeric)), (0)::numeric) AS available_quantity,
    l.unit,
    l.storage_method,
    l.storage_place,
    l.expiration_date,
    l.adjusted_expiration_date,
    l.is_opened,
    l.requires_storage_review
   FROM (inventory_lots l
     LEFT JOIN LATERAL ( SELECT sum(ir.reserved_quantity) AS reserved_quantity
           FROM inventory_reservations ir
          WHERE ((ir.lot_id = l.id) AND (ir.status = 'active'::text))) r ON (true));
```


### inventory_lots_effective
```sql
 SELECT il.id,
    il.user_id,
    il.qty_remaining,
    il.initial_qty,
    il.unit,
    il.acquired_on,
    il.expiration_date,
    il.storage_method,
    il.storage_place,
    COALESCE(p.archetype_id, il.archetype_id, ( SELECT a.id
           FROM archetypes a
          WHERE ((a.cultivar_id = il.cultivar_id) AND (a.is_default IS TRUE))
         LIMIT 1), ( SELECT a2.id
           FROM archetypes a2
          WHERE ((a2.canonical_food_id = il.canonical_food_id) AND (a2.cultivar_id IS NULL) AND (a2.is_default IS TRUE))
         LIMIT 1)) AS effective_archetype_id,
    COALESCE(il.product_id, ( SELECT p2.id
           FROM products p2
          WHERE (p2.archetype_id = COALESCE(p.archetype_id, il.archetype_id, ( SELECT a.id
                   FROM archetypes a
                  WHERE ((a.cultivar_id = il.cultivar_id) AND (a.is_default IS TRUE))
                 LIMIT 1), ( SELECT a2.id
                   FROM archetypes a2
                  WHERE ((a2.canonical_food_id = il.canonical_food_id) AND (a2.cultivar_id IS NULL) AND (a2.is_default IS TRUE))
                 LIMIT 1)))
          ORDER BY p2.is_default DESC, p2.brand, p2.name
         LIMIT 1)) AS effective_product_id
   FROM (inventory_lots il
     LEFT JOIN products p ON ((p.id = il.product_id)));
```


### inventory_lots_resolved
```sql
 SELECT id,
    qty_remaining,
    initial_qty,
    unit,
    storage_method,
    storage_place,
    acquired_on,
    expiration_date,
    notes,
    user_id,
    created_at,
    updated_at,
    product_id,
    canonical_food_id,
    cultivar_id,
    archetype_id,
    COALESCE(canonical_food_id, ( SELECT c.canonical_food_id
           FROM cultivars c
          WHERE (c.id = il.cultivar_id)), ( SELECT a.canonical_food_id
           FROM archetypes a
          WHERE (a.id = il.archetype_id)), ( SELECT a2.canonical_food_id
           FROM (products p
             JOIN archetypes a2 ON ((a2.id = p.archetype_id)))
          WHERE (p.id = il.product_id))) AS resolved_canonical_food_id,
    COALESCE(archetype_id, ( SELECT p.archetype_id
           FROM products p
          WHERE (p.id = il.product_id))) AS resolved_archetype_id
   FROM inventory_lots il;
```


### inventory_lots_with_effective_dlc
```sql
 SELECT id,
    qty_remaining,
    initial_qty,
    unit,
    storage_method,
    storage_place,
    acquired_on,
    expiration_date,
    notes,
    user_id,
    created_at,
    updated_at,
    product_id,
    canonical_food_id,
    cultivar_id,
    archetype_id,
    adjusted_expiration_date,
    is_opened,
    opened_at,
    COALESCE(adjusted_expiration_date, expiration_date) AS effective_expiration_date,
        CASE
            WHEN (adjusted_expiration_date IS NOT NULL) THEN (adjusted_expiration_date - CURRENT_DATE)
            WHEN (expiration_date IS NOT NULL) THEN (expiration_date - CURRENT_DATE)
            ELSE NULL::integer
        END AS days_until_expiration
   FROM inventory_lots il;
```


### pantry_view
```sql
 SELECT il.id AS lot_id,
    il.user_id,
    il.qty_remaining,
    il.initial_qty,
    il.unit,
    il.acquired_on,
    il.expiration_date,
    il.storage_method,
    il.storage_place,
    eff.effective_product_id,
    eff.effective_archetype_id,
    p.name AS product_name,
    p.brand AS product_brand,
    a.name AS archetype_name,
    cf.canonical_name
   FROM ((((inventory_lots il
     JOIN inventory_lots_effective eff ON ((eff.id = il.id)))
     LEFT JOIN products p ON ((p.id = eff.effective_product_id)))
     LEFT JOIN archetypes a ON ((a.id = eff.effective_archetype_id)))
     LEFT JOIN canonical_foods cf ON ((cf.id = a.canonical_food_id)));
```


### unit_conversions
```sql
 SELECT p.product_id,
    p.from_unit,
    p.to_unit,
    p.factor,
    true AS is_product_specific
   FROM unit_conversions_product p
UNION ALL
 SELECT NULL::uuid AS product_id,
    g.from_unit,
    g.to_unit,
    g.factor,
    false AS is_product_specific
   FROM unit_conversions_generic g;
```


### v_expiring_archetypes
```sql
 SELECT il.user_id,
    il.expiration_date,
    il.qty_remaining,
    eff.effective_archetype_id
   FROM (inventory_lots il
     JOIN inventory_lots_effective eff ON ((eff.id = il.id)))
  WHERE (il.qty_remaining > (0)::numeric);
```


### view_canonical_with_categories
```sql
 SELECT cf.id,
    cf.canonical_name,
    cf.category_id,
    rc.name AS category_label,
    cf.subcategory_id,
    rs.label AS subcategory_label,
    cf.primary_unit,
    cf.density_g_per_ml,
    cf.created_at,
    cf.updated_at
   FROM ((canonical_foods cf
     LEFT JOIN reference_categories rc ON ((rc.id = cf.category_id)))
     LEFT JOIN reference_subcategories rs ON ((rs.id = cf.subcategory_id)));
```

