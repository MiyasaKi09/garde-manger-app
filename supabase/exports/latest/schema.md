Output format is unaligned.
Pager usage is off.
# Schéma PostgreSQL (public)
_Généré le : Tue Oct 21 11:45:35 UTC 2025_

## Tables
- _backup_views
- archetypes
- canonical_food_origins
- canonical_food_processes
- canonical_foods
- cooking_nutrition_factors
- countries
- cultivars
- diets
- instructions
- inventory_lots
- legacy_users
- locations
- meal_plans
- nutritional_data
- pantry_items
- planned_meals
- processes
- products
- recipe_ingredients
- recipe_pairings
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
- user_health_goals
- user_profiles
- user_recipe_interactions

---
## Colonnes

### _backup_views
 - view_schema :: text NOT NULL
 - view_name :: text NOT NULL
 - definition :: text NOT NULL
 - dropped_at :: timestamp with time zone default now() NOT NULL

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

### cooking_nutrition_factors
 - id :: integer default nextval('cooking_nutrition_factors_id_seq'::regclass) NOT NULL
 - cooking_method :: character varying NOT NULL
 - nutrient_name :: character varying NOT NULL
 - factor_type :: USER-DEFINED NOT NULL
 - factor_value :: numeric NOT NULL

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

### diets
 - id :: bigint default nextval('diets_id_seq'::regclass) NOT NULL
 - name :: text NOT NULL

### instructions
 - id :: integer default nextval('instructions_id_seq'::regclass) NOT NULL
 - recipe_id :: integer NOT NULL
 - step_number :: integer NOT NULL
 - description :: text NOT NULL

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
 - user_id :: uuid
 - created_at :: timestamp with time zone default now()
 - updated_at :: timestamp with time zone default now()
 - product_id :: uuid
 - canonical_food_id :: bigint
 - cultivar_id :: bigint
 - archetype_id :: bigint

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

### legacy_users
 - id :: integer default nextval('users_id_seq'::regclass) NOT NULL
 - username :: text NOT NULL

### locations
 - id :: uuid default gen_random_uuid() NOT NULL
 - name :: text NOT NULL
 - sort_order :: integer default 0
 - icon :: text

### meal_plans
 - id :: integer default nextval('meal_plans_id_seq'::regclass) NOT NULL
 - user_id :: integer NOT NULL
 - week_start_date :: date NOT NULL

### nutritional_data
 - id :: bigint default nextval('nutritional_data_id_seq'::regclass) NOT NULL
 - source_id :: character varying
 - calories_kcal :: numeric
 - proteines_g :: numeric
 - glucides_g :: numeric
 - lipides_g :: numeric

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

### planned_meals
 - id :: integer default nextval('planned_meals_id_seq'::regclass) NOT NULL
 - plan_id :: integer NOT NULL
 - recipe_id :: integer NOT NULL
 - meal_date :: date NOT NULL
 - meal_type :: USER-DEFINED NOT NULL

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

### recipe_pairings
 - main_recipe_id :: integer NOT NULL
 - side_recipe_id :: integer NOT NULL

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

### user_health_goals
 - user_id :: uuid NOT NULL
 - target_calories :: numeric
 - target_protein_g :: numeric
 - target_fat_g :: numeric
 - target_carbs_g :: numeric
 - created_at :: timestamp with time zone default now() NOT NULL
 - updated_at :: timestamp with time zone default now() NOT NULL

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

---
## Clés primaires
 - _backup_views → (view_schema, view_name, dropped_at)
 - archetypes → (id)
 - canonical_food_origins → (country_id, food_id)
 - canonical_food_processes → (id)
 - canonical_foods → (id)
 - cooking_nutrition_factors → (id)
 - countries → (id)
 - cultivars → (id)
 - diets → (id)
 - instructions → (id)
 - inventory_lots → (id)
 - legacy_users → (id)
 - locations → (id)
 - meal_plans → (id)
 - nutritional_data → (id)
 - pantry_items → (id)
 - planned_meals → (id)
 - processes → (id)
 - products → (id)
 - recipe_ingredients → (id)
 - recipe_pairings → (side_recipe_id, main_recipe_id)
 - recipe_tags → (recipe_id, tag_id)
 - recipes → (id)
 - reference_categories → (id)
 - reference_subcategories → (id)
 - seasonality → (id)
 - tags → (id)
 - unit_conversions_generic → (id)
 - unit_conversions_product → (id)
 - user_allergies → (user_id, canonical_food_id)
 - user_diets → (user_id, diet_id)
 - user_health_goals → (user_id)
 - user_profiles → (user_id)
 - user_recipe_interactions → (id)

---
## Clés étrangères
 - archetypes.cultivar_id → cultivars.id  (constraint archetypes_cultivar_id_fkey)
 - archetypes.canonical_food_id → canonical_foods.id  (constraint archetypes_canonical_food_id_fkey)
 - canonical_food_origins.country_id → countries.id  (constraint canonical_food_origins_country_id_fkey)
 - canonical_food_origins.food_id → canonical_foods.id  (constraint canonical_food_origins_food_id_fkey)
 - canonical_food_processes.process_id → processes.id  (constraint canonical_food_processes_process_id_fkey)
 - canonical_food_processes.food_id → canonical_foods.id  (constraint canonical_food_processes_food_id_fkey)
 - canonical_foods.subcategory_id → reference_subcategories.id  (constraint canonical_foods_subcategory_id_fkey)
 - canonical_foods.nutrition_id → nutritional_data.id  (constraint canonical_foods_nutrition_id_fkey)
 - canonical_foods.category_id → reference_categories.id  (constraint canonical_foods_category_id_fkey)
 - cultivars.canonical_food_id → canonical_foods.id  (constraint cultivars_canonical_food_id_fkey)
 - instructions.recipe_id → recipes.id  (constraint instructions_recipe_id_fkey)
 - inventory_lots.product_id → products.id  (constraint inventory_lots_product_fkey)
 - inventory_lots.canonical_food_id → canonical_foods.id  (constraint inventory_lots_canonical_food_id_fkey)
 - inventory_lots.cultivar_id → cultivars.id  (constraint inventory_lots_cultivar_id_fkey)
 - inventory_lots.archetype_id → archetypes.id  (constraint inventory_lots_archetype_id_fkey)
 - inventory_lots.product_id → products.id  (constraint inventory_lots_product_fk)
 - inventory_lots.canonical_food_id → canonical_foods.id  (constraint inventory_lots_canonical_fk)
 - inventory_lots.cultivar_id → cultivars.id  (constraint inventory_lots_cultivar_fk)
 - inventory_lots.archetype_id → archetypes.id  (constraint inventory_lots_archetype_fk)
 - meal_plans.user_id → legacy_users.id  (constraint meal_plans_user_id_fkey)
 - pantry_items.user_id → legacy_users.id  (constraint pantry_items_user_id_fkey)
 - pantry_items.product_id → products.id  (constraint pantry_items_product_id_fkey)
 - planned_meals.plan_id → meal_plans.id  (constraint planned_meals_plan_id_fkey)
 - planned_meals.recipe_id → recipes.id  (constraint planned_meals_recipe_id_fkey)
 - products.archetype_id → archetypes.id  (constraint products_archetype_fk)
 - products.archetype_id → archetypes.id  (constraint products_archetype_id_fkey)
 - recipe_ingredients.recipe_id → recipes.id  (constraint recipe_ingredients_recipe_id_fkey)
 - recipe_ingredients.archetype_id → archetypes.id  (constraint recipe_ingredients_archetype_id_fkey)
 - recipe_ingredients.canonical_food_id → canonical_foods.id  (constraint recipe_ingredients_canonical_food_id_fkey)
 - recipe_ingredients.sub_recipe_id → recipes.id  (constraint recipe_ingredients_sub_recipe_fk)
 - recipe_pairings.side_recipe_id → recipes.id  (constraint recipe_pairings_side_recipe_id_fkey)
 - recipe_pairings.main_recipe_id → recipes.id  (constraint recipe_pairings_main_recipe_id_fkey)
 - recipe_tags.tag_id → tags.id  (constraint recipe_tags_tag_id_fkey)
 - recipe_tags.recipe_id → recipes.id  (constraint recipe_tags_recipe_id_fkey)
 - reference_subcategories.category_id → reference_categories.id  (constraint reference_subcategories_category_id_fkey)
 - seasonality.food_id → canonical_foods.id  (constraint seasonality_food_id_fkey)
 - user_allergies.canonical_food_id → canonical_foods.id  (constraint user_allergies_canonical_food_id_fkey)
 - user_diets.diet_id → diets.id  (constraint user_diets_diet_id_fkey)
 - user_recipe_interactions.user_id → legacy_users.id  (constraint user_recipe_interactions_user_id_fkey)
 - user_recipe_interactions.recipe_id → recipes.id  (constraint user_recipe_interactions_recipe_id_fkey)

---
## Index
 - public._backup_views → _backup_views_pkey : CREATE UNIQUE INDEX _backup_views_pkey ON public._backup_views USING btree (view_schema, view_name, dropped_at)
 - public.archetypes → archetypes_default_per_canonical : CREATE UNIQUE INDEX archetypes_default_per_canonical ON public.archetypes USING btree (canonical_food_id) WHERE ((is_default IS TRUE) AND (cultivar_id IS NULL))
 - public.archetypes → archetypes_default_per_cultivar : CREATE UNIQUE INDEX archetypes_default_per_cultivar ON public.archetypes USING btree (cultivar_id) WHERE (is_default IS TRUE)
 - public.archetypes → archetypes_pkey : CREATE UNIQUE INDEX archetypes_pkey ON public.archetypes USING btree (id)
 - public.archetypes → idx_archetypes_parent : CREATE INDEX idx_archetypes_parent ON public.archetypes USING btree (canonical_food_id, cultivar_id)
 - public.archetypes → idx_archetypes_process : CREATE INDEX idx_archetypes_process ON public.archetypes USING btree (process)
 - public.canonical_food_origins → canonical_food_origins_pkey : CREATE UNIQUE INDEX canonical_food_origins_pkey ON public.canonical_food_origins USING btree (food_id, country_id)
 - public.canonical_food_processes → canonical_food_processes_pkey : CREATE UNIQUE INDEX canonical_food_processes_pkey ON public.canonical_food_processes USING btree (id)
 - public.canonical_foods → canonical_foods_canonical_name_key : CREATE UNIQUE INDEX canonical_foods_canonical_name_key ON public.canonical_foods USING btree (canonical_name)
 - public.canonical_foods → canonical_foods_pkey : CREATE UNIQUE INDEX canonical_foods_pkey ON public.canonical_foods USING btree (id)
 - public.cooking_nutrition_factors → cooking_nutrition_factors_cooking_method_nutrient_name_fact_key : CREATE UNIQUE INDEX cooking_nutrition_factors_cooking_method_nutrient_name_fact_key ON public.cooking_nutrition_factors USING btree (cooking_method, nutrient_name, factor_type)
 - public.cooking_nutrition_factors → cooking_nutrition_factors_pkey : CREATE UNIQUE INDEX cooking_nutrition_factors_pkey ON public.cooking_nutrition_factors USING btree (id)
 - public.countries → countries_name_key : CREATE UNIQUE INDEX countries_name_key ON public.countries USING btree (name)
 - public.countries → countries_pkey : CREATE UNIQUE INDEX countries_pkey ON public.countries USING btree (id)
 - public.cultivars → cultivars_pkey : CREATE UNIQUE INDEX cultivars_pkey ON public.cultivars USING btree (id)
 - public.cultivars → idx_cultivars_name_ci : CREATE INDEX idx_cultivars_name_ci ON public.cultivars USING btree (lower(cultivar_name))
 - public.cultivars → uq_cultivars_per_species : CREATE UNIQUE INDEX uq_cultivars_per_species ON public.cultivars USING btree (canonical_food_id, lower(cultivar_name))
 - public.diets → diets_name_key : CREATE UNIQUE INDEX diets_name_key ON public.diets USING btree (name)
 - public.diets → diets_pkey : CREATE UNIQUE INDEX diets_pkey ON public.diets USING btree (id)
 - public.instructions → instructions_pkey : CREATE UNIQUE INDEX instructions_pkey ON public.instructions USING btree (id)
 - public.inventory_lots → idx_inv_archetype : CREATE INDEX idx_inv_archetype ON public.inventory_lots USING btree (archetype_id)
 - public.inventory_lots → idx_inv_canonical : CREATE INDEX idx_inv_canonical ON public.inventory_lots USING btree (canonical_food_id)
 - public.inventory_lots → idx_inv_cultivar : CREATE INDEX idx_inv_cultivar ON public.inventory_lots USING btree (cultivar_id)
 - public.inventory_lots → idx_inv_product : CREATE INDEX idx_inv_product ON public.inventory_lots USING btree (product_id)
 - public.inventory_lots → idx_inv_user_exp : CREATE INDEX idx_inv_user_exp ON public.inventory_lots USING btree (user_id, expiration_date)
 - public.inventory_lots → idx_inventory_lots_expiration : CREATE INDEX idx_inventory_lots_expiration ON public.inventory_lots USING btree (expiration_date)
 - public.inventory_lots → idx_inventory_lots_storage : CREATE INDEX idx_inventory_lots_storage ON public.inventory_lots USING btree (storage_method)
 - public.inventory_lots → idx_inventory_lots_user_exp : CREATE INDEX idx_inventory_lots_user_exp ON public.inventory_lots USING btree (user_id, expiration_date)
 - public.inventory_lots → idx_inventory_lots_user_id : CREATE INDEX idx_inventory_lots_user_id ON public.inventory_lots USING btree (user_id)
 - public.inventory_lots → idx_inventory_lots_user_qty : CREATE INDEX idx_inventory_lots_user_qty ON public.inventory_lots USING btree (user_id) WHERE (qty_remaining > (0)::numeric)
 - public.inventory_lots → inventory_lots_pkey : CREATE UNIQUE INDEX inventory_lots_pkey ON public.inventory_lots USING btree (id)
 - public.legacy_users → users_pkey : CREATE UNIQUE INDEX users_pkey ON public.legacy_users USING btree (id)
 - public.legacy_users → users_username_key : CREATE UNIQUE INDEX users_username_key ON public.legacy_users USING btree (username)
 - public.locations → locations_pkey : CREATE UNIQUE INDEX locations_pkey ON public.locations USING btree (id)
 - public.meal_plans → meal_plans_pkey : CREATE UNIQUE INDEX meal_plans_pkey ON public.meal_plans USING btree (id)
 - public.nutritional_data → nutritional_data_pkey : CREATE UNIQUE INDEX nutritional_data_pkey ON public.nutritional_data USING btree (id)
 - public.nutritional_data → nutritional_data_source_id_key : CREATE UNIQUE INDEX nutritional_data_source_id_key ON public.nutritional_data USING btree (source_id)
 - public.pantry_items → pantry_items_pkey : CREATE UNIQUE INDEX pantry_items_pkey ON public.pantry_items USING btree (id)
 - public.planned_meals → planned_meals_pkey : CREATE UNIQUE INDEX planned_meals_pkey ON public.planned_meals USING btree (id)
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
 - public.recipe_ingredients → idx_recipe_ingredients_recipe : CREATE INDEX idx_recipe_ingredients_recipe ON public.recipe_ingredients USING btree (recipe_id)
 - public.recipe_ingredients → idx_recipe_ingredients_recipe_id : CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients USING btree (recipe_id)
 - public.recipe_ingredients → idx_recipe_ingredients_sub : CREATE INDEX idx_recipe_ingredients_sub ON public.recipe_ingredients USING btree (sub_recipe_id)
 - public.recipe_ingredients → recipe_ingredients_pkey : CREATE UNIQUE INDEX recipe_ingredients_pkey ON public.recipe_ingredients USING btree (id)
 - public.recipe_ingredients → uq_recipe_ingredients_unique_line_idx : CREATE UNIQUE INDEX uq_recipe_ingredients_unique_line_idx ON public.recipe_ingredients USING btree (recipe_id, COALESCE(canonical_food_id, ('-1'::integer)::bigint), COALESCE(archetype_id, ('-1'::integer)::bigint), COALESCE(unit, ''::character varying), COALESCE(notes, ''::text))
 - public.recipe_pairings → recipe_pairings_pkey : CREATE UNIQUE INDEX recipe_pairings_pkey ON public.recipe_pairings USING btree (main_recipe_id, side_recipe_id)
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
 - public.tags → uq_tags_name : CREATE UNIQUE INDEX uq_tags_name ON public.tags USING btree (name)
 - public.unit_conversions_generic → idx_unit_conv_generic_norm : CREATE UNIQUE INDEX idx_unit_conv_generic_norm ON public.unit_conversions_generic USING btree (lower(from_unit), lower(to_unit))
 - public.unit_conversions_generic → unit_conversions_generic_pkey : CREATE UNIQUE INDEX unit_conversions_generic_pkey ON public.unit_conversions_generic USING btree (id)
 - public.unit_conversions_product → idx_unit_conv_product_norm : CREATE UNIQUE INDEX idx_unit_conv_product_norm ON public.unit_conversions_product USING btree (product_id, lower(from_unit), lower(to_unit))
 - public.unit_conversions_product → unit_conversions_product_pkey : CREATE UNIQUE INDEX unit_conversions_product_pkey ON public.unit_conversions_product USING btree (id)
 - public.user_allergies → user_allergies_pkey : CREATE UNIQUE INDEX user_allergies_pkey ON public.user_allergies USING btree (user_id, canonical_food_id)
 - public.user_diets → user_diets_pkey : CREATE UNIQUE INDEX user_diets_pkey ON public.user_diets USING btree (user_id, diet_id)
 - public.user_health_goals → user_health_goals_pkey : CREATE UNIQUE INDEX user_health_goals_pkey ON public.user_health_goals USING btree (user_id)
 - public.user_profiles → user_profiles_pkey : CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (user_id)
 - public.user_recipe_interactions → user_recipe_interactions_pkey : CREATE UNIQUE INDEX user_recipe_interactions_pkey ON public.user_recipe_interactions USING btree (id)
 - public.user_recipe_interactions → user_recipe_interactions_user_id_recipe_id_key : CREATE UNIQUE INDEX user_recipe_interactions_user_id_recipe_id_key ON public.user_recipe_interactions USING btree (user_id, recipe_id)

---
## Contraintes CHECK
 - archetypes_origin_oneof_chk ON archetypes : CHECK (((canonical_food_id IS NOT NULL) OR (cultivar_id IS NOT NULL)))
 - chk_archetype_parent ON archetypes : CHECK ((((canonical_food_id IS NOT NULL) AND (cultivar_id IS NULL)) OR ((canonical_food_id IS NULL) AND (cultivar_id IS NOT NULL))))
 - inventory_lots_one_of ON inventory_lots : CHECK (((((((canonical_food_id IS NOT NULL))::integer + ((cultivar_id IS NOT NULL))::integer) + ((archetype_id IS NOT NULL))::integer) + ((product_id IS NOT NULL))::integer) = 1))
 - inventory_lots_storage_method_check ON inventory_lots : CHECK (((storage_method)::text = ANY ((ARRAY['pantry'::character varying, 'fridge'::character varying, 'freezer'::character varying])::text[])))
 - chk_ingredient_source ON recipe_ingredients : CHECK ((((archetype_id IS NOT NULL) AND (canonical_food_id IS NULL)) OR ((archetype_id IS NULL) AND (canonical_food_id IS NOT NULL))))
 - recipe_ing_oneof_exactly_one ON recipe_ingredients : CHECK ((((((canonical_food_id IS NOT NULL))::integer + ((archetype_id IS NOT NULL))::integer) + ((sub_recipe_id IS NOT NULL))::integer) = 1))
 - reference_categories_typical_storage_check ON reference_categories : CHECK ((typical_storage = ANY (ARRAY['fridge'::text, 'pantry'::text, 'freezer'::text, 'cellar'::text, 'varied'::text])))

---
## Vues
 - inventory_lots_effective
 - inventory_lots_resolved
 - pantry_view
 - unit_conversions
 - v_expiring_archetypes
 - view_canonical_with_categories

---
## Définition des vues

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

