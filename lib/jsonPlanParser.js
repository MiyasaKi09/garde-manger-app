/**
 * Parser pour les fichiers JSON de planification nutritionnelle.
 * Convertit la structure JSON du nutritionniste vers le format interne
 * (identique à la sortie de xlsxParser.parseWorkbook).
 */

function num(val) {
  if (val == null) return null
  const n = parseFloat(val)
  return isNaN(n) ? null : Math.round(n * 10) / 10
}

function toISODate(dateStr, year) {
  // "01/04" → "2026-04-01"
  const m = dateStr.match(/(\d{1,2})\/(\d{2})/)
  if (!m) return null
  const day = m[1].padStart(2, '0')
  const month = m[2]
  return `${year}-${month}-${day}`
}

function guessYear(data, fileName) {
  // From label like "Avril 2026"
  const labelMatch = (data.label || '').match(/(20\d{2})/)
  if (labelMatch) return parseInt(labelMatch[1])
  // From id like "avril-2026"
  const idMatch = (data.id || '').match(/(20\d{2})/)
  if (idMatch) return parseInt(idMatch[1])
  // From file name
  const fnMatch = (fileName || '').match(/(20\d{2})/)
  if (fnMatch) return parseInt(fnMatch[1])
  return new Date().getFullYear()
}

function parseMealsForPerson(day, personKey, personName, isoDate, dayType) {
  const meals = []

  // Déjeuner
  const dej = day.dej?.[personKey]
  if (dej?.desc) {
    meals.push({
      person_name: personName,
      meal_date: isoDate,
      meal_type: 'dejeuner',
      day_type: dayType,
      description: dej.desc,
      kcal: num(dej.kcal),
      protein_g: num(dej.p),
      carbs_g: num(dej.g),
      fat_g: num(dej.l),
      fiber_g: num(dej.f)
    })
  }

  // Dîner
  const din = day.din?.[personKey]
  if (din?.desc) {
    meals.push({
      person_name: personName,
      meal_date: isoDate,
      meal_type: 'diner',
      day_type: dayType,
      description: din.desc,
      kcal: num(din.kcal),
      protein_g: num(din.p),
      carbs_g: num(din.g),
      fat_g: num(din.l),
      fiber_g: num(din.f)
    })
  }

  // Collation
  const col = day.col?.[personKey]
  if (col?.desc) {
    meals.push({
      person_name: personName,
      meal_date: isoDate,
      meal_type: 'collation',
      day_type: dayType,
      description: col.desc,
      kcal: num(col.kcal),
      protein_g: num(col.p),
      carbs_g: num(col.g),
      fat_g: num(col.l),
      fiber_g: num(col.f)
    })
  }

  // PDJ (si présent dans le JSON)
  const pdj = day.pdj?.[personKey]
  if (pdj?.desc) {
    meals.push({
      person_name: personName,
      meal_date: isoDate,
      meal_type: 'pdj',
      day_type: dayType,
      description: pdj.desc,
      kcal: num(pdj.kcal),
      protein_g: num(pdj.p),
      carbs_g: num(pdj.g),
      fat_g: num(pdj.l),
      fiber_g: num(pdj.f)
    })
  }

  return meals
}

function parseDailyTotals(day, isoDate) {
  const totals = []
  const total = day.total

  if (total?.j) {
    totals.push({
      person_name: 'Julien',
      meal_date: isoDate,
      kcal: num(total.j.kcal),
      protein_g: num(total.j.p),
      carbs_g: num(total.j.g),
      fat_g: num(total.j.l),
      fiber_g: num(total.j.f),
      validated: total.j.ok === true
    })
  }

  if (total?.z) {
    totals.push({
      person_name: 'Zoé',
      meal_date: isoDate,
      kcal: num(total.z.kcal),
      protein_g: num(total.z.p),
      carbs_g: num(total.z.g),
      fat_g: num(total.z.l),
      fiber_g: num(total.z.f),
      validated: total.z.ok === true
    })
  }

  return totals
}

function parsePrepTasks(day, isoDate) {
  const tasks = []
  const cooking = day.cooking

  if (!cooking) return tasks

  // Dinner cooking steps → prep tasks
  if (cooking.dinner?.steps) {
    for (const step of cooking.dinner.steps) {
      tasks.push({
        prep_date: isoDate,
        prep_label: `${day.dayName} ${day.date}`,
        task: `${step.action}: ${step.detail}`,
        estimated_time: step.duration || null
      })
    }
  }

  // Prep steps
  if (cooking.prep?.steps) {
    for (const step of cooking.prep.steps) {
      tasks.push({
        prep_date: isoDate,
        prep_label: `${day.dayName} ${day.date}`,
        task: `[Prep] ${step.action}: ${step.detail}`,
        estimated_time: step.duration || null
      })
    }
  }

  return tasks
}

function parseRecipes(recipes) {
  return (recipes || []).map(r => {
    let timing = ''
    if (r.timing?.actif) timing += r.timing.actif
    if (r.timing?.total) timing += (timing ? ' / ' : '') + r.timing.total

    let macrosStr = null
    if (r.macros100g) {
      const m = r.macros100g
      macrosStr = `${m.kcal} kcal | ${m.p}P | ${m.g}G | ${m.l}L | ${m.f}F`
    }

    let portionsStr = null
    if (r.portions) {
      const parts = []
      if (r.portions.j) parts.push(`Julien: ${r.portions.j}`)
      if (r.portions.z) parts.push(`Zoé: ${r.portions.z}`)
      portionsStr = parts.join(' — ')
    }

    return {
      name: r.name,
      timing: timing || null,
      ingredients: r.ingredients || null,
      macros_per_100g: macrosStr,
      rendement: r.rendement || null,
      portions: portionsStr,
      reheat: r.reheat || null,
      instructions: r.jour2 || null
    }
  })
}

function parseShoppingItems(groceries) {
  const items = []

  for (const week of (groceries || [])) {
    const weekLabel = week.week || week.weekLabel || 'S1'

    for (const cat of (week.categories || [])) {
      for (const item of (cat.items || [])) {
        items.push({
          week_label: weekLabel,
          category: cat.name || null,
          product_name: item.product,
          quantity: item.quantity || null,
          checked: false
        })
      }
    }
  }

  return items
}

/**
 * Point d'entrée principal. Parse un fichier JSON de plan nutritionnel.
 * @param {string} jsonString - Le contenu JSON brut
 * @param {string} fileName - Nom du fichier (pour deviner l'année)
 * @returns {{ meals, dailyTotals, batchRecipes, prepTasks, shoppingItems, meta, warnings }}
 */
export function parseJsonPlan(jsonString, fileName) {
  const data = JSON.parse(jsonString)
  const year = guessYear(data, fileName)
  const warnings = []

  const allMeals = []
  const allDailyTotals = []
  const allPrepTasks = []

  for (const day of (data.days || [])) {
    const isoDate = toISODate(day.date, year)
    if (!isoDate) {
      warnings.push(`Date invalide: ${day.date}`)
      continue
    }

    const dayType = day.type || null

    // Meals for both persons
    allMeals.push(...parseMealsForPerson(day, 'j', 'Julien', isoDate, dayType))
    allMeals.push(...parseMealsForPerson(day, 'z', 'Zoé', isoDate, dayType))

    // Daily totals
    allDailyTotals.push(...parseDailyTotals(day, isoDate))

    // Prep tasks
    allPrepTasks.push(...parsePrepTasks(day, isoDate))
  }

  const allBatchRecipes = parseRecipes(data.recipes)
  const allShoppingItems = parseShoppingItems(data.groceries)

  // Meta
  const allDates = allMeals.map(m => m.meal_date).filter(Boolean).sort()
  const meta = {
    fileName,
    dateRangeStart: allDates[0] || null,
    dateRangeEnd: allDates[allDates.length - 1] || null,
    monthLabel: data.label || null
  }

  return {
    meals: allMeals,
    dailyTotals: allDailyTotals,
    batchRecipes: allBatchRecipes,
    prepTasks: allPrepTasks,
    shoppingItems: allShoppingItems,
    meta,
    warnings
  }
}
