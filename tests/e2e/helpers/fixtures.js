/**
 * fixtures.js — shared deterministic data for E2E tests.
 */

export const RECIPE_ID = 42
export const SESSION_ID = 'session-stub-001'
export const IMPORT_ID = 'import-stub-001'
export const ITEM_ID = 'item-stub-001'
export const LOT_ID = 'lot-stub-001'

// ── Generated recipe ──────────────────────────────────────────────────────────
export const GENERATED_RECIPE = {
  id: RECIPE_ID,
  title: 'Poulet rôti aux herbes',
  description: 'Un classique.',
  servings: 4,
  prep_min: 15,
  cook_min: 60,
  ingredients: [
    { name: 'Poulet fermier', quantity: 1200, unit: 'g' },
    { name: 'Herbes de Provence', quantity: 10, unit: 'g' },
  ],
  steps: [
    { step_no: 1, instruction: 'Préchauffer le four à 200°C', duration_min: 5 },
    { step_no: 2, instruction: 'Assaisonner le poulet' },
  ],
  source: 'ai',
  created_at: '2024-01-10T12:00:00Z',
  rating: null,
  cook_count: 0,
  image_url: null,
  // Vague 2 field — needed for recipe-repair test
  status: 'needs_review',
  nutrition_per_serving: {
    kcal: 380,
    protein_g: 42,
    carbs_g: 5,
    fat_g: 20,
    fiber_g: 0.5,
  },
}

// ── Draft cooking session (returned by POST /api/cooking-sessions) ────────────
export const DRAFT_SESSION = {
  id: SESSION_ID,
  recipe_source: 'ai',
  generated_recipe_id: RECIPE_ID,
  planned_servings: 4,
  status: 'draft',
  recipe: {
    title: 'Poulet rôti aux herbes',
    servings: 4,
  },
  ingredients: [
    {
      id: 1,
      planned_name: 'Poulet fermier',
      planned_entity_type: 'canonical',
      planned_entity_id: 10,
      planned_quantity: 1200,
      planned_unit: 'g',
      status: 'available',
      missing_qty: 0,
      allocations: [{ lot_id: LOT_ID, qty: 1200, label: 'Lot A', expiration_date: '2026-08-01' }],
    },
    {
      id: 2,
      planned_name: 'Herbes de Provence',
      planned_entity_type: 'canonical',
      planned_entity_id: 11,
      planned_quantity: 10,
      planned_unit: 'g',
      status: 'missing',
      missing_qty: 10,
      allocations: [],
    },
  ],
}

// ── Shopping items (returned by GET /api/planning/imports/:id) ────────────────
export const SHOPPING_ITEM = {
  id: ITEM_ID,
  product_name: 'Poulet fermier',
  quantity: '1 kg',
  category: 'Viandes',
  week_label: 'S1',
  checked: false,
  stocked: false,
  canonical_food_id: 10,
  archetype_id: null,
  review_status: 'auto',
  created_lot_ids: null,
  image_url: null,
  notes: null,
  container_qty: null,
  container_size: null,
  container_unit: null,
}

// A second item with pending review_status (triggers the "à confirmer" banner)
export const SHOPPING_ITEM_PENDING = {
  id: 'item-stub-002',
  product_name: 'Coriandre fraîche',
  quantity: '1 botte',
  category: 'Herbes',
  week_label: 'S1',
  checked: false,
  stocked: false,
  canonical_food_id: null,
  archetype_id: null,
  review_status: 'pending',
  created_lot_ids: null,
  image_url: null,
  notes: null,
  container_qty: null,
  container_size: null,
  container_unit: null,
}

// ── Pantry lot ────────────────────────────────────────────────────────────────
export const INVENTORY_LOT = {
  id: LOT_ID,
  canonical_food_id: 10,
  archetype_id: null,
  qty_remaining: 1500,
  initial_qty: 1500,
  unit: 'g',
  storage_method: 'fridge',
  storage_place: 'Frigo',
  expiration_date: '2026-08-01T00:00:00Z',
  adjusted_expiration_date: null,
  acquired_on: '2026-07-01',
  notes: null,
  is_opened: false,
  is_containerized: false,
  container_size: null,
  container_unit: null,
  product_name: 'Poulet fermier',
  canonical_foods: {
    id: 10,
    canonical_name: 'Poulet fermier',
    density_g_per_ml: null,
    unit_weight_grams: null,
    shelf_life_days_pantry: 3,
  },
}

// ── Review panel data (returned by GET /api/ingredients/review) ───────────────
export const REVIEW_DATA = {
  shopping_items: [
    {
      id: ITEM_ID,
      product_name: 'Coriandre fraîche',
      review_status: 'pending',
    },
  ],
  recipe_ingredients: [],
  canonicals: [],
}
