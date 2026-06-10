import { describe, it, expect, beforeAll } from 'vitest'
import ExcelJS from 'exceljs'
import { parseWorkbook } from '@/lib/xlsxParser.js'

/**
 * Construit en mémoire un classeur .xlsx représentatif du format
 * "plan nutritionniste" attendu par le parseur :
 * - un onglet personne ("Julien") avec header Date/Jour/Type journée/Déjeuner/kcal/P/G/L/F/Dîner/kcal/P/G/L/F,
 *   des lignes repas (date texte "Lun 16/03" et date Excel native), une ligne collation
 *   et une ligne TOTAL JOUR validée,
 * - un onglet "Planning Prep",
 * - un onglet "Courses S12" (catégorie + produits).
 */
async function buildFixtureBuffer() {
  const wb = new ExcelJS.Workbook()

  // ─── Onglet personne ───
  const julien = wb.addWorksheet('Julien')
  julien.addRow([
    'Date', 'Jour', 'Type journée',
    'Déjeuner', 'kcal', 'P', 'G', 'L', 'F',
    'Dîner', 'kcal', 'P', 'G', 'L', 'F'
  ])
  // Ligne repas : date texte + description en richText (cas exceljs à normaliser)
  const mealRow = julien.addRow([
    'Lun 16/03', 'Lundi', 'Séance haut',
    null, 650, 45, 70, 15, 8,
    'Omelette aux légumes', 480, 32, 20, 28, 6
  ])
  mealRow.getCell(4).value = {
    richText: [{ text: 'Poulet rôti ' }, { text: '+ riz' }]
  }
  // Collation rattachée au 16/03
  julien.addRow([null, null, null, '🥜 Collation : amandes', 180, 6, 5, 15, 3])
  // Total jour validé
  julien.addRow([null, 'TOTAL JOUR', null, null, 1310, 83, 95, 58, 17, '✅'])
  // Ligne repas avec une vraie date Excel (objet Date → numéro de série)
  julien.addRow([
    new Date(Date.UTC(2025, 2, 17)), 'Mardi', 'Repos actif',
    'Saumon + patate douce', 600, 40, 55, 22, 7
  ])

  // ─── Onglet Planning Prep ───
  const prep = wb.addWorksheet('Planning Prep')
  prep.addRow(['Date', 'Tâche', 'Temps'])
  prep.addRow(['Dim 15/03', 'Batch cuisson légumes', '2h'])

  // ─── Onglet Courses ───
  const courses = wb.addWorksheet('Courses S12')
  courses.addRow(['Produit', 'Quantité'])
  courses.addRow(['🥩 Viandes & Poissons', null])
  courses.addRow(['Poulet fermier', '800 g'])

  return wb.xlsx.writeBuffer()
}

describe('parseWorkbook (exceljs)', () => {
  let parsed

  beforeAll(async () => {
    const buffer = await buildFixtureBuffer()
    // Même forme d'appel que la route d'import : Uint8Array + nom de fichier
    parsed = await parseWorkbook(new Uint8Array(buffer), 'plan_mars_2025.xlsx')
  })

  it('retourne la structure complète attendue', () => {
    expect(parsed).toHaveProperty('meals')
    expect(parsed).toHaveProperty('dailyTotals')
    expect(parsed).toHaveProperty('batchRecipes')
    expect(parsed).toHaveProperty('prepTasks')
    expect(parsed).toHaveProperty('shoppingItems')
    expect(parsed).toHaveProperty('meta')
    expect(parsed).toHaveProperty('warnings')
    expect(parsed.meta.sheetNames).toEqual(['Julien', 'Planning Prep', 'Courses S12'])
    expect(parsed.meta.fileName).toBe('plan_mars_2025.xlsx')
  })

  it('parse les repas du 16/03 (date texte) avec macros et richText normalisé', () => {
    const dej = parsed.meals.find(
      m => m.meal_date === '2025-03-16' && m.meal_type === 'dejeuner'
    )
    expect(dej).toEqual({
      person_name: 'Julien',
      meal_date: '2025-03-16',
      meal_type: 'dejeuner',
      day_type: 'Séance haut',
      description: 'Poulet rôti + riz', // richText aplati en string
      kcal: 650,
      protein_g: 45,
      carbs_g: 70,
      fat_g: 15,
      fiber_g: 8
    })

    const din = parsed.meals.find(
      m => m.meal_date === '2025-03-16' && m.meal_type === 'diner'
    )
    expect(din).toMatchObject({
      description: 'Omelette aux légumes',
      kcal: 480,
      protein_g: 32
    })
  })

  it('rattache la collation à la date courante', () => {
    const coll = parsed.meals.find(m => m.meal_type === 'collation')
    expect(coll).toMatchObject({
      meal_date: '2025-03-16',
      description: '🥜 Collation : amandes',
      kcal: 180,
      fiber_g: 3
    })
  })

  it('parse le total jour avec validation ✅', () => {
    expect(parsed.dailyTotals).toHaveLength(1)
    expect(parsed.dailyTotals[0]).toEqual({
      person_name: 'Julien',
      meal_date: '2025-03-16',
      kcal: 1310,
      protein_g: 83,
      carbs_g: 95,
      fat_g: 58,
      fiber_g: 17,
      validated: true
    })
  })

  it('convertit une date Excel native (numéro de série) en date ISO', () => {
    const dej = parsed.meals.find(m => m.meal_date === '2025-03-17')
    expect(dej).toMatchObject({
      meal_type: 'dejeuner',
      day_type: 'Repos actif',
      description: 'Saumon + patate douce',
      kcal: 600
    })
  })

  it('parse le planning prep', () => {
    expect(parsed.prepTasks).toEqual([{
      prep_date: '2025-03-15',
      prep_label: 'Dim 15/03',
      task: 'Batch cuisson légumes',
      estimated_time: '2h'
    }])
  })

  it('parse la liste de courses avec catégories', () => {
    expect(parsed.shoppingItems).toEqual([{
      week_label: 'S12',
      category: '🥩 Viandes & Poissons',
      product_name: 'Poulet fermier',
      quantity: '800 g',
      checked: false
    }])
  })

  it('calcule la plage de dates et le mois dans meta', () => {
    expect(parsed.meta.dateRangeStart).toBe('2025-03-16')
    expect(parsed.meta.dateRangeEnd).toBe('2025-03-17')
    expect(parsed.meta.monthLabel).toBe('Mars 2025')
    expect(parsed.warnings).toEqual([])
  })
})
