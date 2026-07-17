/**
 * Mini-mock en mémoire du client supabase-js pour les tests comportementaux
 * d'API routes : query builder chaînable ET thenable, résolu en { data, error }.
 *
 * Couverture volontairement limitée aux opérations utilisées par les routes
 * testées : select / insert / update / delete, filtres eq / neq / in / is /
 * gt / gte / lt / lte / or / like, order / limit, single / maybeSingle.
 *
 * - `or('a.is.null,b.gte.X')` : segments `champ.op.valeur`, opérateurs
 *   is/eq/gt/gte/lt/lte, `null` littéral supporté.
 * - `order` : NULLS LAST en ascendant, NULLS FIRST en descendant (défaut
 *   Postgres), surchargé par `nullsFirst`.
 * - `queueError(table, op, message)` : fait échouer la PROCHAINE opération
 *   `op` ('select' | 'insert' | 'update' | 'delete') sur `table`.
 * - `rows(table)` : copie des lignes courantes (assertions).
 */
export function createSupabaseMock(initialTables = {}) {
  const tables = new Map()
  for (const [name, rows] of Object.entries(initialTables)) {
    tables.set(name, rows.map((row) => ({ ...row })))
  }
  let autoId = 1
  const pendingErrors = []

  const tableRows = (name) => {
    if (!tables.has(name)) tables.set(name, [])
    return tables.get(name)
  }

  const compare = (a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b
    const left = String(a)
    const right = String(b)
    return left < right ? -1 : left > right ? 1 : 0
  }

  const escapeRegex = (ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const likeToRegex = (pattern) => {
    let out = ''
    for (let i = 0; i < pattern.length; i += 1) {
      const ch = pattern[i]
      if (ch === '\\' && i + 1 < pattern.length) {
        out += escapeRegex(pattern[i + 1])
        i += 1
      } else if (ch === '%') out += '.*'
      else if (ch === '_') out += '.'
      else out += escapeRegex(ch)
    }
    return new RegExp(`^${out}$`)
  }

  const matchOp = (row, field, op, value) => {
    const current = row[field]
    switch (op) {
      case 'eq':
        return current === value || (current != null && value != null && String(current) === String(value))
      case 'neq':
        return !matchOp(row, field, 'eq', value)
      case 'is':
        return value === null ? current == null : current === value
      case 'gt':
        return current != null && compare(current, value) > 0
      case 'gte':
        return current != null && compare(current, value) >= 0
      case 'lt':
        return current != null && compare(current, value) < 0
      case 'lte':
        return current != null && compare(current, value) <= 0
      case 'like':
        return typeof current === 'string' && likeToRegex(String(value)).test(current)
      default:
        throw new Error(`supabaseMock: opérateur non géré « ${op} »`)
    }
  }

  const parseOrSegment = (segment) => {
    const [field, op, ...rest] = segment.split('.')
    const raw = rest.join('.')
    const value = raw === 'null' ? null : raw
    return { field, op, value }
  }

  function builder(tableName) {
    const state = {
      table: tableName,
      op: 'select',
      filters: [],
      payload: null,
      orderBy: null,
      limitCount: null,
      mode: 'many',
    }

    async function run() {
      const errIndex = pendingErrors.findIndex((e) => e.table === state.table && e.op === state.op)
      if (errIndex >= 0) {
        const [queued] = pendingErrors.splice(errIndex, 1)
        return { data: null, error: { message: queued.message } }
      }

      const rows = tableRows(state.table)
      const matched = rows.filter((row) => state.filters.every((fn) => fn(row)))
      let result

      if (state.op === 'select') {
        let out = matched
        if (state.orderBy) {
          const { field, ascending = true, nullsFirst } = state.orderBy
          const nullsGoFirst = nullsFirst ?? !ascending
          out = out.slice().sort((ra, rb) => {
            const a = ra[field]
            const b = rb[field]
            if (a == null && b == null) return 0
            if (a == null) return nullsGoFirst ? -1 : 1
            if (b == null) return nullsGoFirst ? 1 : -1
            return ascending ? compare(a, b) : compare(b, a)
          })
        }
        if (state.limitCount != null) out = out.slice(0, state.limitCount)
        result = out.map((row) => ({ ...row }))
      } else if (state.op === 'insert') {
        const list = Array.isArray(state.payload) ? state.payload : [state.payload]
        result = list.map((item) => {
          const row = { ...item }
          if (row.id == null) row.id = `mock-${autoId++}`
          rows.push(row)
          return { ...row }
        })
      } else if (state.op === 'update') {
        for (const row of matched) Object.assign(row, state.payload)
        result = matched.map((row) => ({ ...row }))
      } else if (state.op === 'delete') {
        const removed = new Set(matched)
        tables.set(state.table, rows.filter((row) => !removed.has(row)))
        result = matched.map((row) => ({ ...row }))
      }

      if (state.mode === 'single') {
        if (result.length !== 1) {
          return { data: null, error: { message: `single(): ${result.length} ligne(s) pour ${state.table}` } }
        }
        return { data: result[0], error: null }
      }
      if (state.mode === 'maybeSingle') {
        if (result.length > 1) {
          return { data: null, error: { message: `maybeSingle(): ${result.length} lignes pour ${state.table}` } }
        }
        return { data: result[0] ?? null, error: null }
      }
      return { data: result, error: null }
    }

    const api = {
      select() { return api },
      insert(payload) { state.op = 'insert'; state.payload = payload; return api },
      update(payload) { state.op = 'update'; state.payload = payload; return api },
      delete() { state.op = 'delete'; return api },
      eq(field, value) { state.filters.push((row) => matchOp(row, field, 'eq', value)); return api },
      neq(field, value) { state.filters.push((row) => matchOp(row, field, 'neq', value)); return api },
      in(field, values) {
        state.filters.push((row) => (values || []).some((value) => matchOp(row, field, 'eq', value)))
        return api
      },
      is(field, value) { state.filters.push((row) => matchOp(row, field, 'is', value)); return api },
      gt(field, value) { state.filters.push((row) => matchOp(row, field, 'gt', value)); return api },
      gte(field, value) { state.filters.push((row) => matchOp(row, field, 'gte', value)); return api },
      lt(field, value) { state.filters.push((row) => matchOp(row, field, 'lt', value)); return api },
      lte(field, value) { state.filters.push((row) => matchOp(row, field, 'lte', value)); return api },
      like(field, pattern) { state.filters.push((row) => matchOp(row, field, 'like', pattern)); return api },
      or(expression) {
        const segments = String(expression).split(',').map(parseOrSegment)
        state.filters.push((row) => segments.some(({ field, op, value }) => matchOp(row, field, op, value)))
        return api
      },
      order(field, options = {}) { state.orderBy = { field, ...options }; return api },
      limit(count) { state.limitCount = count; return api },
      single() { state.mode = 'single'; return run() },
      maybeSingle() { state.mode = 'maybeSingle'; return run() },
      then(onFulfilled, onRejected) { return run().then(onFulfilled, onRejected) },
    }
    return api
  }

  return {
    from: (name) => builder(name),
    rows: (name) => tableRows(name).map((row) => ({ ...row })),
    queueError: (table, op, message) => { pendingErrors.push({ table, op, message }) },
  }
}
