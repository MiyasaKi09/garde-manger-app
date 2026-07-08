import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/lots/create
 *
 * Deux modes exclusifs selon le corps de la requête :
 *
 * ── Mode lots ──────────────────────────────────────────────────────────────
 *   { lots: [lot, ...] }          — tableau d'au moins 1 lot
 *   { lot: {...} }                — raccourci pour un seul lot
 *
 *   Champs d'un lot (tous optionnels sauf qty_remaining) :
 *     qty_remaining  : number >= 0          (requis)
 *     initial_qty    : number >= 0          (défaut = qty_remaining)
 *     unit           : string
 *     storage_method : 'pantry'|'fridge'|'freezer'
 *     storage_place  : string | null
 *     expiration_date: 'YYYY-MM-DD' | null
 *     acquired_on    : 'YYYY-MM-DD'
 *     notes          : string | null
 *     // Liens produit — la contrainte DB exige exactement 1 non-null
 *     canonical_food_id : integer
 *     cultivar_id       : integer
 *     archetype_id      : integer
 *     product_id        : string (uuid)
 *     // Contenants
 *     is_containerized : boolean
 *     container_size   : number | null
 *     container_unit   : string | null
 *
 *   → 200 { success: true, lots: [created_lot, ...] }
 *
 * ── Mode catalogue ─────────────────────────────────────────────────────────
 *   { catalog: { kind: 'canonical'|'archetype', ...champs } }
 *
 *   kind='canonical' :
 *     canonical_name          : string  (requis)
 *     category_id             : integer | null
 *     primary_unit            : string
 *     shelf_life_days_pantry  : integer | null
 *     shelf_life_days_fridge  : integer | null
 *     shelf_life_days_freezer : integer | null
 *
 *   kind='archetype' :
 *     name                    : string  (requis)
 *     canonical_food_id       : integer (requis)
 *     primary_unit            : string
 *     shelf_life_days_pantry  : integer | null
 *     shelf_life_days_fridge  : integer | null
 *     shelf_life_days_freezer : integer | null
 *
 *   → 200 { success: true, entry: { id, type, ...champs } }
 *
 * Auth : authenticateRequest (Bearer ou cookie). user_id forcé côté serveur.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const STORAGE_METHODS = ['pantry', 'fridge', 'freezer']
const SHELF_FIELDS = ['shelf_life_days_pantry', 'shelf_life_days_fridge', 'shelf_life_days_freezer']

// ─── Validation helpers ────────────────────────────────────────────────────

function validateLot(raw, index) {
  const errors = []
  const lot = {}
  const tag = `lots[${index}]`

  // qty_remaining — requis
  const qty = Number(raw.qty_remaining)
  if (!Number.isFinite(qty) || qty < 0) {
    errors.push(`${tag}.qty_remaining doit être un nombre >= 0`)
  } else {
    lot.qty_remaining = qty
  }

  // initial_qty — facultatif, défaut = qty_remaining
  if ('initial_qty' in raw) {
    const iq = Number(raw.initial_qty)
    if (!Number.isFinite(iq) || iq < 0) {
      errors.push(`${tag}.initial_qty doit être un nombre >= 0`)
    } else {
      lot.initial_qty = iq
    }
  } else {
    lot.initial_qty = qty
  }

  // unit
  if ('unit' in raw) {
    if (typeof raw.unit !== 'string') errors.push(`${tag}.unit doit être une chaîne`)
    else lot.unit = raw.unit
  }

  // storage_method
  if ('storage_method' in raw) {
    if (!STORAGE_METHODS.includes(raw.storage_method)) {
      errors.push(`${tag}.storage_method invalide (pantry | fridge | freezer)`)
    } else {
      lot.storage_method = raw.storage_method
    }
  }

  // storage_place
  if ('storage_place' in raw) {
    const v = raw.storage_place
    if (v !== null && typeof v !== 'string') errors.push(`${tag}.storage_place doit être une chaîne ou null`)
    else lot.storage_place = v
  }

  // expiration_date
  if ('expiration_date' in raw) {
    const v = raw.expiration_date
    if (v === null) {
      lot.expiration_date = null
    } else if (typeof v === 'string' && DATE_RE.test(v)) {
      lot.expiration_date = v
    } else {
      errors.push(`${tag}.expiration_date doit être YYYY-MM-DD ou null`)
    }
  }

  // acquired_on
  if ('acquired_on' in raw) {
    const v = raw.acquired_on
    if (typeof v === 'string' && DATE_RE.test(v)) lot.acquired_on = v
    else errors.push(`${tag}.acquired_on doit être YYYY-MM-DD`)
  }

  // notes
  if ('notes' in raw) {
    const v = raw.notes
    if (v !== null && typeof v !== 'string') errors.push(`${tag}.notes doit être une chaîne ou null`)
    else lot.notes = v
  }

  // Liens produit (bigint FKs → entiers)
  for (const field of ['canonical_food_id', 'cultivar_id', 'archetype_id']) {
    if (field in raw && raw[field] !== null && raw[field] !== undefined) {
      const v = Number(raw[field])
      if (!Number.isInteger(v) || v <= 0) {
        errors.push(`${tag}.${field} doit être un entier positif`)
      } else {
        lot[field] = v
      }
    }
  }

  // product_id (uuid string)
  if ('product_id' in raw && raw.product_id !== null && raw.product_id !== undefined) {
    if (typeof raw.product_id !== 'string') {
      errors.push(`${tag}.product_id doit être un UUID string`)
    } else {
      lot.product_id = raw.product_id
    }
  }

  // Contenants
  if ('is_containerized' in raw) {
    if (typeof raw.is_containerized !== 'boolean') {
      errors.push(`${tag}.is_containerized doit être un booléen`)
    } else {
      lot.is_containerized = raw.is_containerized
    }
  }
  if ('container_size' in raw) {
    const v = raw.container_size
    if (v === null) {
      lot.container_size = null
    } else {
      const n = Number(v)
      if (!Number.isFinite(n) || n <= 0) errors.push(`${tag}.container_size doit être un nombre positif ou null`)
      else lot.container_size = n
    }
  }
  if ('container_unit' in raw) {
    const v = raw.container_unit
    if (v !== null && typeof v !== 'string') errors.push(`${tag}.container_unit doit être une chaîne ou null`)
    else lot.container_unit = v
  }

  return { lot, errors }
}

function validateCatalog(raw) {
  if (!raw || typeof raw !== 'object') {
    return { errors: ['catalog doit être un objet'] }
  }
  if (!['canonical', 'archetype'].includes(raw.kind)) {
    return { errors: ['catalog.kind doit être "canonical" ou "archetype"'] }
  }

  const errors = []
  const shelf = {}

  for (const field of SHELF_FIELDS) {
    if (field in raw) {
      const v = raw[field]
      if (v === null) {
        shelf[field] = null
      } else {
        const n = Number(v)
        if (!Number.isInteger(n) || n <= 0) {
          errors.push(`catalog.${field} doit être un entier positif ou null`)
        } else {
          shelf[field] = n
        }
      }
    }
  }

  if (raw.kind === 'canonical') {
    if (!raw.canonical_name?.trim()) errors.push('catalog.canonical_name requis')
    if (errors.length) return { errors }
    return {
      kind: 'canonical',
      table: 'canonical_foods',
      entry: {
        canonical_name: raw.canonical_name.trim(),
        category_id: raw.category_id ? Number(raw.category_id) : null,
        primary_unit: raw.primary_unit || 'g',
        ...shelf,
      },
      errors: [],
    }
  }

  // kind = 'archetype'
  if (!raw.name?.trim()) errors.push('catalog.name requis')
  if (!raw.canonical_food_id) errors.push('catalog.canonical_food_id requis')
  if (errors.length) return { errors }
  return {
    kind: 'archetype',
    table: 'archetypes',
    entry: {
      name: raw.name.trim(),
      canonical_food_id: Number(raw.canonical_food_id),
      primary_unit: raw.primary_unit || 'g',
      ...shelf,
    },
    errors: [],
  }
}

// ─── Handler ───────────────────────────────────────────────────────────────

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  // ── Mode catalogue ────────────────────────────────────────────────────────
  if (body.catalog) {
    const { kind, table, entry, errors } = validateCatalog(body.catalog)
    if (errors?.length) {
      return NextResponse.json({ error: errors.join(' ; ') }, { status: 400 })
    }

    const { data, error } = await supabase
      .from(table)
      .insert(entry)
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Création catalogue échouée' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      entry: { id: data.id, type: kind, ...entry },
    })
  }

  // ── Mode lots ─────────────────────────────────────────────────────────────
  const rawLots = Array.isArray(body.lots)
    ? body.lots
    : body.lot
    ? [body.lot]
    : null

  if (!rawLots || rawLots.length === 0) {
    return NextResponse.json(
      { error: 'lots (array) ou lot (objet) requis' },
      { status: 400 }
    )
  }

  const allErrors = []
  const validatedLots = []

  for (let i = 0; i < rawLots.length; i++) {
    const { lot, errors } = validateLot(rawLots[i], i)
    if (errors.length) {
      allErrors.push(...errors)
    } else {
      // user_id forcé côté serveur — jamais accepté du client
      validatedLots.push({ ...lot, user_id: user.id })
    }
  }

  if (allErrors.length) {
    return NextResponse.json({ error: allErrors.join(' ; ') }, { status: 400 })
  }

  const { data: createdLots, error } = await supabase
    .from('inventory_lots')
    .insert(validatedLots)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, lots: createdLots })
}
