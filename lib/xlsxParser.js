/**
 * Parser flexible pour fichiers .xlsx generés par le nutritionniste.
 * Gère les variations de format entre mois (colonnes, dates, separateurs).
 */
import * as XLSX from 'xlsx'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getRows(worksheet) {
  return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })
}

function str(val) {
  if (val == null) return ''
  return String(val).replace(/^[\s\u00A0\u200B]+|[\s\u00A0\u200B]+$/g, '')
}

function num(val) {
  if (val == null) return null
  const n = parseFloat(val)
  return isNaN(n) ? null : Math.round(n * 10) / 10
}

/**
 * Essaie d'extraire une date DD/MM depuis une cellule.
 * Gère : "16/03", "Wed 01/04", "Lun 16/03", dates Excel numériques.
 * Retourne un objet { day, month } ou null.
 */
function extractDate(val, year) {
  if (val == null) return null
  const s = str(val)
  // Pattern DD/MM ou XXX DD/MM
  const m = s.match(/(\d{1,2})\/(\d{2})/)
  if (m) {
    const day = parseInt(m[1])
    const month = parseInt(m[2])
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return { day, month }
    }
  }
  // Excel serial date
  if (typeof val === 'number' && val > 40000 && val < 60000) {
    const d = XLSX.SSF.parse_date_code(val)
    if (d) return { day: d.d, month: d.m }
  }
  return null
}

function toISODate(day, month, year) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Devine l'année à partir des dates trouvées dans le fichier ou du nom du fichier.
 */
function guessYear(fileName, rows) {
  // Depuis le nom du fichier
  const ym = (fileName || '').match(/(20\d{2})/)
  if (ym) return parseInt(ym[1])
  // Depuis le contenu (chercher dans les premieres lignes)
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i] || []
    for (const cell of row) {
      const m = str(cell).match(/(20\d{2})/)
      if (m) return parseInt(m[1])
    }
  }
  return new Date().getFullYear()
}

/**
 * Trouve la ligne header en cherchant une ligne avec au moins 2 "kcal".
 * Retourne l'index de la ligne et le mapping des colonnes.
 */
function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i] || []
    const kcalCount = row.filter(c => /^kcal$/i.test(str(c))).length
    if (kcalCount >= 2) {
      return { headerIndex: i, row }
    }
  }
  // Fallback: chercher une ligne avec "Déjeuner" ou "DÉJEUNER"
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i] || []
    const hasDejeune = row.some(c => /d[ée]jeuner/i.test(str(c)))
    if (hasDejeune) return { headerIndex: i, row }
  }
  return null
}

/**
 * Mappe les colonnes par nom depuis la ligne header.
 * Retourne un objet avec les indices de chaque colonne.
 */
function mapColumns(headerRow) {
  const cols = {}
  let firstKcal = -1
  let secondKcal = -1

  for (let i = 0; i < headerRow.length; i++) {
    const s = str(headerRow[i]).toLowerCase()
    if (s === 'date') cols.date = i
    if (s === 'jour') cols.jour = i
    if (/type\s*journ/i.test(s)) cols.dayType = i
    if (/d[ée]jeuner/i.test(s) && !cols.dejDesc) cols.dejDesc = i
    if (/d[iî]ner/i.test(s) && !cols.dinDesc) cols.dinDesc = i
    if (s === 'kcal') {
      if (firstKcal === -1) firstKcal = i
      else if (secondKcal === -1) secondKcal = i
    }
  }

  // Si on a trouvé 2 blocs "kcal", mapper les macros autour
  if (firstKcal >= 0) {
    cols.dejKcal = firstKcal
    cols.dejP = firstKcal + 1
    cols.dejG = firstKcal + 2
    cols.dejL = firstKcal + 3
    cols.dejF = firstKcal + 4
    // Le dejeuner desc est juste avant le premier kcal
    if (!cols.dejDesc) cols.dejDesc = firstKcal - 1
  }
  if (secondKcal >= 0) {
    cols.dinKcal = secondKcal
    cols.dinP = secondKcal + 1
    cols.dinG = secondKcal + 2
    cols.dinL = secondKcal + 3
    cols.dinF = secondKcal + 4
    // Le diner desc est juste avant le second kcal
    if (!cols.dinDesc) cols.dinDesc = secondKcal - 1
  }

  // Date est generalement col 0
  if (cols.date == null) cols.date = 0

  return cols
}

// ─── Person Sheet Parser ────────────────────────────────────────────────────

function isCollationRow(row, cols) {
  for (const cell of row) {
    const s = str(cell)
    if (/collation/i.test(s) || s.includes('🥜')) return true
  }
  return false
}

function isTotalRow(row) {
  for (const cell of row) {
    if (/TOTAL\s*JOUR/i.test(str(cell))) return true
  }
  return false
}

function isPrepRow(row) {
  for (const cell of row) {
    const s = str(cell)
    if (s.includes('📦') || s.includes('🍳') || /^Restes\b/i.test(s) || s.includes('🎉')) return true
    if (/\bPrep\b/i.test(s) && !/Planning Prep/i.test(s)) return true
  }
  return false
}

function isWeekSeparator(row) {
  for (const cell of row) {
    const s = str(cell)
    if (/SEMAINE/i.test(s) && /[━═─]/u.test(s)) return true
  }
  return false
}

function isPdjBanner(row) {
  const fullRow = row.map(c => str(c)).join(' ')
  const hasPdj = /PDJ|PETIT-D[ÉE]JEUNER/i.test(fullRow)
  const hasFood = /skyr|œuf|oeuf/i.test(fullRow)
  return hasPdj && hasFood
}

/**
 * Parse un onglet personne (Julien ou Zoé).
 */
export function parsePersonSheet(worksheet, personName, fileName) {
  const rows = getRows(worksheet)
  const year = guessYear(fileName, rows)
  const warnings = []
  const meals = []
  const dailyTotals = []

  const header = findHeaderRow(rows)
  if (!header) {
    warnings.push(`Impossible de trouver la ligne header pour ${personName}`)
    return { meals, dailyTotals, warnings }
  }

  const cols = mapColumns(header.row)

  // Detecter PDJ fixe (peut etre reparti sur plusieurs lignes avant le header)
  let pdjDesc = null
  let pdjMacros = null
  for (let i = 0; i <= header.headerIndex; i++) {
    const row = rows[i] || []
    if (isPdjBanner(row)) {
      // Extraire description et macros du PDJ - prendre toutes les cellules non-vides
      const fullText = row.map(c => str(c)).filter(Boolean).join(' — ')
      // Trouver la cellule avec la description detaillee (contient "skyr")
      const descCell = row.find(c => /skyr/i.test(str(c)))
      let rawDesc = descCell ? str(descCell) : fullText
      // Nettoyer: retirer les macros de la description ("— 383 kcal | 44P | 9G | 18L | ~0F")
      rawDesc = rawDesc.replace(/\s*[—–-]\s*\d+\s*kcal.*$/i, '').trim()
      // Retirer emojis/symboles PUA au début, puis le prefixe "PDJ FIXE :" ou "PETIT-DÉJEUNER QUOTIDIEN"
      rawDesc = rawDesc.replace(/^[^\x20-\x7E\u00C0-\u024F]+\s*/g, '') // remove non-latin prefix chars (emojis/PUA)
      rawDesc = rawDesc.replace(/^(PDJ\s*(FIXE)?|PETIT-D[ÉE]JEUNER\s*(QUOTIDIEN)?(\s*\(fixe\))?)\s*[:(]?\s*/i, '').trim()
      pdjDesc = rawDesc || 'Petit-déjeuner fixe'
      // Essayer d'extraire les macros: chercher pattern "383 kcal | 44P | 9G | 18L"
      const macroText = fullText
      const km = macroText.match(/(\d+)\s*kcal/i)
      const pm = macroText.match(/(\d+)\s*P\b/)
      const gm = macroText.match(/(\d+)\s*G\b/)
      const lm = macroText.match(/(\d+)\s*L\b/)
      if (km) {
        pdjMacros = {
          kcal: num(km[1]),
          protein_g: pm ? num(pm[1]) : null,
          carbs_g: gm ? num(gm[1]) : null,
          fat_g: lm ? num(lm[1]) : null,
          fiber_g: null
        }
      }
      break
    }
  }

  let currentDate = null
  let currentDayType = null

  for (let i = header.headerIndex + 1; i < rows.length; i++) {
    const row = rows[i] || []
    if (row.every(c => c == null || str(c) === '')) continue

    try {
      // Week separator
      if (isWeekSeparator(row)) continue

      // Date row = meal row
      const dateInfo = extractDate(row[cols.date], year)
      if (dateInfo) {
        currentDate = toISODate(dateInfo.day, dateInfo.month, year)
        currentDayType = cols.dayType != null ? str(row[cols.dayType]) : null
        // Aussi checker col B pour day type si pas defini
        if (!currentDayType && cols.jour != null) {
          // Le type journée peut être dans la colonne après "jour"
          const jourIdx = cols.jour
          if (jourIdx + 1 < row.length && jourIdx + 1 !== cols.dejDesc) {
            const candidate = str(row[jourIdx + 1])
            if (/séance|marche|repos|activité/i.test(candidate)) {
              currentDayType = candidate
            }
          }
        }
        // Fallback: check all cells for day type pattern
        if (!currentDayType) {
          for (const cell of row) {
            const s = str(cell)
            if (/séance|marche active|repos actif|activité libre/i.test(s)) {
              currentDayType = s
              break
            }
          }
        }

        // Dejeuner
        const dejDesc = str(row[cols.dejDesc])
        if (dejDesc) {
          meals.push({
            person_name: personName,
            meal_date: currentDate,
            meal_type: 'dejeuner',
            day_type: currentDayType,
            description: dejDesc,
            kcal: num(row[cols.dejKcal]),
            protein_g: num(row[cols.dejP]),
            carbs_g: num(row[cols.dejG]),
            fat_g: num(row[cols.dejL]),
            fiber_g: num(row[cols.dejF])
          })
        }

        // Diner
        if (cols.dinDesc != null) {
          const dinDesc = str(row[cols.dinDesc])
          if (dinDesc) {
            meals.push({
              person_name: personName,
              meal_date: currentDate,
              meal_type: 'diner',
              day_type: currentDayType,
              description: dinDesc,
              kcal: num(row[cols.dinKcal]),
              protein_g: num(row[cols.dinP]),
              carbs_g: num(row[cols.dinG]),
              fat_g: num(row[cols.dinL]),
              fiber_g: num(row[cols.dinF])
            })
          }
        }

        // PDJ fixe pour Julien
        if (pdjDesc && /julien/i.test(personName) && currentDate) {
          meals.push({
            person_name: personName,
            meal_date: currentDate,
            meal_type: 'pdj',
            day_type: currentDayType,
            description: pdjDesc,
            kcal: pdjMacros?.kcal || 383,
            protein_g: pdjMacros?.protein_g || 44,
            carbs_g: pdjMacros?.carbs_g || 9,
            fat_g: pdjMacros?.fat_g || 18,
            fiber_g: pdjMacros?.fiber_g || null
          })
        }
        continue
      }

      // Collation row
      if (isCollationRow(row, cols) && currentDate) {
        // La description est dans la colonne dejeuner ou la premiere colonne texte non-vide
        let collDesc = str(row[cols.dejDesc])
        if (!collDesc) {
          for (const cell of row) {
            const s = str(cell)
            if (/collation|🥜/i.test(s)) { collDesc = s; break }
          }
        }
        if (collDesc) {
          meals.push({
            person_name: personName,
            meal_date: currentDate,
            meal_type: 'collation',
            day_type: currentDayType,
            description: collDesc,
            kcal: num(row[cols.dejKcal]),
            protein_g: num(row[cols.dejP]),
            carbs_g: num(row[cols.dejG]),
            fat_g: num(row[cols.dejL]),
            fiber_g: num(row[cols.dejF])
          })
        }
        continue
      }

      // Total row
      if (isTotalRow(row) && currentDate) {
        const validated = row.some(c => str(c).includes('✅'))
        dailyTotals.push({
          person_name: personName,
          meal_date: currentDate,
          kcal: num(row[cols.dejKcal]),
          protein_g: num(row[cols.dejP]),
          carbs_g: num(row[cols.dejG]),
          fat_g: num(row[cols.dejL]),
          fiber_g: num(row[cols.dejF]),
          validated
        })
        continue
      }

      // Prep row - skip (info only)
      if (isPrepRow(row)) continue

    } catch (err) {
      warnings.push(`Row ${i + 1} (${personName}): ${err.message}`)
    }
  }

  return { meals, dailyTotals, warnings }
}

// ─── Recap Macros Parser ────────────────────────────────────────────────────

export function parseRecapSheet(worksheet, fileName) {
  const rows = getRows(worksheet)
  const year = guessYear(fileName, rows)
  const warnings = []
  const dailyTotals = []

  if (rows.length < 2) return { dailyTotals, warnings }

  // Header row est generalement la premiere ligne
  const headerRow = rows[0] || []

  // Trouver les colonnes pour Julien et Zoé
  let jKcalIdx = -1, zKcalIdx = -1

  for (let i = 0; i < headerRow.length; i++) {
    const s = str(headerRow[i]).toLowerCase()
    if (s.includes('j-kcal') || s.includes('j kcal')) jKcalIdx = i
    if (s.includes('z-kcal') || s.includes('z kcal')) zKcalIdx = i
  }

  // Fallback: trouver par pattern "kcal" sequentiel
  if (jKcalIdx === -1) {
    const kcalIndices = []
    for (let i = 0; i < headerRow.length; i++) {
      if (/kcal/i.test(str(headerRow[i]))) kcalIndices.push(i)
    }
    if (kcalIndices.length >= 2) {
      jKcalIdx = kcalIndices[0]
      zKcalIdx = kcalIndices[1]
    }
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || []
    const dateInfo = extractDate(row[0], year)
    if (!dateInfo) continue

    const isoDate = toISODate(dateInfo.day, dateInfo.month, year)

    // Julien
    if (jKcalIdx >= 0) {
      const jValidIdx = jKcalIdx + 5 // ✓ column
      dailyTotals.push({
        person_name: 'Julien',
        meal_date: isoDate,
        kcal: num(row[jKcalIdx]),
        protein_g: num(row[jKcalIdx + 1]),
        carbs_g: num(row[jKcalIdx + 2]),
        fat_g: num(row[jKcalIdx + 3]),
        fiber_g: num(row[jKcalIdx + 4]),
        validated: str(row[jValidIdx]).includes('✅')
      })
    }

    // Zoé
    if (zKcalIdx >= 0) {
      const zValidIdx = zKcalIdx + 5
      dailyTotals.push({
        person_name: 'Zoé',
        meal_date: isoDate,
        kcal: num(row[zKcalIdx]),
        protein_g: num(row[zKcalIdx + 1]),
        carbs_g: num(row[zKcalIdx + 2]),
        fat_g: num(row[zKcalIdx + 3]),
        fiber_g: num(row[zKcalIdx + 4]),
        validated: str(row[zValidIdx]).includes('✅')
      })
    }
  }

  return { dailyTotals, warnings }
}

// ─── Planning Prep Parser ───────────────────────────────────────────────────

export function parsePrepSheet(worksheet, fileName) {
  const rows = getRows(worksheet)
  const year = guessYear(fileName, rows)
  const warnings = []
  const prepTasks = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || []
    const dateStr = str(row[0])
    const task = str(row[1])
    const time = str(row[2])

    if (!dateStr || !task) continue

    // Extraire la date depuis "Dim 15/03" ou "Lun 16/03"
    const dateInfo = extractDate(dateStr, year)
    const isoDate = dateInfo ? toISODate(dateInfo.day, dateInfo.month, year) : null

    prepTasks.push({
      prep_date: isoDate,
      prep_label: dateStr,
      task,
      estimated_time: time || null
    })
  }

  return { prepTasks, warnings }
}

// ─── Recipes Parser ─────────────────────────────────────────────────────────

export function parseRecipesSheet(worksheet) {
  const rows = getRows(worksheet)
  const warnings = []
  const batchRecipes = []

  if (rows.length < 2) return { batchRecipes, warnings }

  // Detecter le header — préférer une ligne avec BOTH recette+ingrédient
  let headerIdx = 0
  let bestScore = 0
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i] || []
    const hasRecette = row.some(c => /recette|batch|nom/i.test(str(c)))
    const hasIngr = row.some(c => /ingr[ée]dient/i.test(str(c)))
    const score = (hasRecette ? 1 : 0) + (hasIngr ? 2 : 0)
    if (score > bestScore) { bestScore = score; headerIdx = i }
  }

  const headerRow = rows[headerIdx] || []
  // Map columns
  const colMap = {}
  for (let i = 0; i < headerRow.length; i++) {
    const s = str(headerRow[i]).toLowerCase()
    if (/batch|recette|nom/i.test(s) && !colMap.name) colMap.name = i
    if (/ingr[ée]dient/i.test(s)) colMap.ingredients = i
    if (/macro/i.test(s)) colMap.macros = i
    if (/rendement/i.test(s)) colMap.rendement = i
    if (/portion/i.test(s)) colMap.portions = i
    if (/r[ée]chauff/i.test(s)) { colMap.reheat = i; if (!colMap.instructions) colMap.instructions = i }
    if (/instruction|pr[ée]paration/i.test(s)) colMap.instructions = i
    if (/t\.?\s*actif/i.test(s)) colMap.timeActive = i
    if (/t\.?\s*total/i.test(s)) colMap.timeTotal = i
  }

  if (colMap.name == null) colMap.name = 0

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || []
    const name = str(row[colMap.name])
    if (!name) continue

    let timing = ''
    if (colMap.timeActive != null) timing += str(row[colMap.timeActive])
    if (colMap.timeTotal != null) timing += (timing ? ' / ' : '') + str(row[colMap.timeTotal])

    let reheat = colMap.reheat != null ? str(row[colMap.reheat]) : null
    let instructions = colMap.instructions != null ? str(row[colMap.instructions]) : null

    // If reheat and instructions come from the same column, split them
    if (colMap.reheat === colMap.instructions && reheat) {
      const fullText = reheat
      const blankIdx = fullText.indexOf('\n\n')
      if (blankIdx > 0) {
        reheat = fullText.substring(0, blankIdx).trim()
        instructions = fullText.substring(blankIdx).trim()
      } else {
        const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length > 1) {
          reheat = lines[0]
          instructions = lines.slice(1).join('\n')
        }
      }
    }

    batchRecipes.push({
      name,
      timing: timing || null,
      ingredients: colMap.ingredients != null ? str(row[colMap.ingredients]) : null,
      macros_per_100g: colMap.macros != null ? str(row[colMap.macros]) : null,
      rendement: colMap.rendement != null ? str(row[colMap.rendement]) : null,
      portions: colMap.portions != null ? str(row[colMap.portions]) : null,
      reheat,
      instructions
    })
  }

  return { batchRecipes, warnings }
}

// ─── Shopping List Parser ───────────────────────────────────────────────────

export function parseShoppingSheet(worksheet, weekLabel) {
  const rows = getRows(worksheet)
  const warnings = []
  const items = []
  let currentCategory = null

  // Trouver la premiere ligne de donnees (skip titre/header)
  let startIdx = 0
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i] || []
    const s = str(row[0]).toLowerCase()
    if (s.includes('produit') || s.includes('☐') || s.includes('quantit')) {
      startIdx = i + 1
      break
    }
  }

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i] || []
    const col0 = str(row[0])
    const col1 = str(row[1])

    if (!col0) continue

    // Category header: row with text in col A, no quantity in col B
    // Categories are short labels like "🥩 Viandes & Poissons" or "FRUITS & OLÉAGINEUX"
    if (!col1 && !col0.includes('☐') && !/produit|quantit|liste/i.test(col0)) {
      currentCategory = col0
      continue
    }

    // Product row
    if (col0 && col0 !== '☐') {
      items.push({
        week_label: weekLabel,
        category: currentCategory,
        product_name: col0,
        quantity: col1 || null,
        checked: false
      })
    }
  }

  return { items, warnings }
}

// ─── Main Parser ────────────────────────────────────────────────────────────

/**
 * Point d'entrée principal. Parse tout le workbook.
 * @param {ArrayBuffer} buffer - Le contenu du fichier .xlsx
 * @param {string} fileName - Nom du fichier (pour deviner l'annee)
 * @returns {{ meals, dailyTotals, batchRecipes, prepTasks, shoppingItems, meta, warnings }}
 */
export function parseWorkbook(buffer, fileName) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const allMeals = []
  const allDailyTotals = []
  const allBatchRecipes = []
  const allPrepTasks = []
  const allShoppingItems = []
  const allWarnings = []
  const meta = { sheetNames: workbook.SheetNames, fileName }

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName]
    const nameLower = sheetName.toLowerCase()

    try {
      if (/^julien$/i.test(sheetName) || /^zo[ée]$/i.test(sheetName)) {
        const personName = /julien/i.test(sheetName) ? 'Julien' : 'Zoé'
        const result = parsePersonSheet(ws, personName, fileName)
        allMeals.push(...result.meals)
        allDailyTotals.push(...result.dailyTotals)
        allWarnings.push(...result.warnings)
      } else if (/r[ée]cap\s*macros/i.test(sheetName)) {
        const result = parseRecapSheet(ws, fileName)
        // Merge avec les totals existants (recap a priorité)
        for (const rt of result.dailyTotals) {
          const existing = allDailyTotals.find(
            t => t.person_name === rt.person_name && t.meal_date === rt.meal_date
          )
          if (existing) {
            Object.assign(existing, rt) // Recap overwrites person sheet totals
          } else {
            allDailyTotals.push(rt)
          }
        }
        allWarnings.push(...result.warnings)
      } else if (/planning\s*prep/i.test(sheetName)) {
        const result = parsePrepSheet(ws, fileName)
        allPrepTasks.push(...result.prepTasks)
        allWarnings.push(...result.warnings)
      } else if (/recettes/i.test(sheetName)) {
        const result = parseRecipesSheet(ws)
        allBatchRecipes.push(...result.batchRecipes)
        allWarnings.push(...result.warnings)
      } else if (/^courses/i.test(sheetName)) {
        // Extraire le label de la semaine depuis le nom de l'onglet
        const weekMatch = sheetName.match(/S(\d+)/i)
        const weekLabel = weekMatch ? `S${weekMatch[1]}` : sheetName
        const result = parseShoppingSheet(ws, weekLabel)
        allShoppingItems.push(...result.items)
        allWarnings.push(...result.warnings)
      }
    } catch (err) {
      allWarnings.push(`Erreur onglet "${sheetName}": ${err.message}`)
    }
  }

  // Calculer la plage de dates
  const allDates = allMeals.map(m => m.meal_date).filter(Boolean).sort()
  meta.dateRangeStart = allDates[0] || null
  meta.dateRangeEnd = allDates[allDates.length - 1] || null

  // Deviner le mois
  if (meta.dateRangeStart) {
    const d = new Date(meta.dateRangeStart)
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    meta.monthLabel = `${months[d.getMonth()]} ${d.getFullYear()}`
  }

  return {
    meals: allMeals,
    dailyTotals: allDailyTotals,
    batchRecipes: allBatchRecipes,
    prepTasks: allPrepTasks,
    shoppingItems: allShoppingItems,
    meta,
    warnings: allWarnings
  }
}
