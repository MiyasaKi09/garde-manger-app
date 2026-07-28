import { describe, expect, it } from 'vitest'
import manifest from '@/data/encyclopedia/manifest.json'
import index from '@/data/encyclopedia/index.json'
import philosophy from '@/data/encyclopedia/books/V00-A.json'
import { buildEncyclopediaView } from '@/lib/domain/encyclopedia/catalog'

describe('Encyclopédie Myko', () => {
  it('matérialise exactement les 48 volumes du plan directeur', () => {
    expect(manifest.volumes).toHaveLength(48)
    expect(manifest.volumes.map((volume) => volume.code)).toEqual(
      Array.from({ length: 48 }, (_, index) => `V${String(index).padStart(2, '0')}`),
    )
    expect(manifest.generated_summary.books).toBe(282)
  })

  it('conserve les livres A à Q de la Bible des ingrédients', () => {
    const ingredients = manifest.volumes.find((volume) => volume.code === 'V01')
    expect(ingredients.books).toHaveLength(17)
    expect(ingredients.books.map((book) => book.suffix)).toEqual(
      'ABCDEFGHIJKLMNOPQ'.split(''),
    )
  })

  it('distingue les contrats vides du premier livre réellement rédigé', () => {
    const books = manifest.volumes.flatMap((volume) => volume.books)
    expect(new Set(books.map((book) => book.code)).size).toBe(books.length)
    for (const book of books) {
      expect(book.mission, book.code).toBeTruthy()
      expect(book.required_fields.length, book.code).toBeGreaterThan(0)
      expect(book.quality_gates.length, book.code).toBeGreaterThan(0)
      expect(Array.isArray(book.source_contracts), book.code).toBe(true)
    }

    const authoredBooks = books.filter((book) => book.content_path)
    expect(authoredBooks).toHaveLength(1)
    expect(authoredBooks[0]).toMatchObject({
      code: 'V00-A',
      content_status: 'draft',
      content_path: 'data/encyclopedia/books/V00-A.json',
    })
    expect(books.filter((book) => book.code !== 'V00-A').every(
      (book) => book.content_status === 'structure',
    )).toBe(true)
  })

  it('rédige V00-A avec de vraies règles, sources, exemples, exceptions et tests', () => {
    expect(philosophy.book_code).toBe('V00-A')
    expect(philosophy.validation.authoring_complete).toBe(true)
    expect(philosophy.validation.human_review_status).toBe('pending')
    expect(philosophy.definitions.length).toBeGreaterThanOrEqual(12)
    expect(philosophy.sources.length).toBeGreaterThanOrEqual(2)
    expect(philosophy.rules.length).toBeGreaterThanOrEqual(15)

    for (const rule of philosophy.rules) {
      expect(rule.rule, rule.code).toBeTruthy()
      expect(rule.justification, rule.code).toBeTruthy()
      expect(rule.examples.length, rule.code).toBeGreaterThan(0)
      expect(rule.counterexamples.length, rule.code).toBeGreaterThan(0)
      expect(rule.exceptions.length, rule.code).toBeGreaterThan(0)
      expect(rule.tests.length, rule.code).toBeGreaterThan(0)
    }

    const stockRule = philosophy.rules.find((rule) => rule.code === 'PHI-009')
    expect(JSON.stringify(stockRule)).toContain('Pintade')
    expect(JSON.stringify(stockRule)).toContain('90 jours')
    expect(index.book_contents).toContainEqual(expect.objectContaining({
      book_code: 'V00-A',
      status: 'draft',
      authoring_complete: true,
      rule_count: philosophy.rules.length,
    }))
  })

  it('indexe chaque recette une fois et autorise plusieurs vues éditoriales', () => {
    expect(index.recipe_memberships).toHaveLength(309)
    expect(new Set(index.recipe_memberships.map((item) => item.recipe_code)).size).toBe(309)
    expect(index.recipe_memberships.every((item) => /^V(?:1[1-9]|[23][0-9]|40)$/.test(item.primary_volume))).toBe(true)
    expect(index.recipe_memberships.some((item) => item.volumes.length > 1)).toBe(true)
    expect(index.summary.recipe_memberships).toBeGreaterThan(index.summary.recipes)
  })

  it('rattache toutes les techniques extraites au volume V02', () => {
    expect(index.techniques.length).toBeGreaterThanOrEqual(250)
    expect(index.techniques.every((technique) => /^V02-[A-J]$/.test(technique.book_code))).toBe(true)
    expect(new Set(index.techniques.map((technique) => technique.code)).size).toBe(index.techniques.length)
  })

  it('fusionne les agrégats live dans l’inventaire sans gonfler la validation', () => {
    const view = buildEncyclopediaView(manifest, index, {
      food_concepts: 441,
      techniques: 351,
      recipe_families: 302,
      planning_ready: 124,
    })
    const ingredients = view.volumes.find((volume) => volume.code === 'V01')
    const recipes = view.volumes.find((volume) => volume.code === 'V10')

    expect(view.data_status).toBe('live')
    expect(ingredients.current_entries).toBe(441)
    expect(ingredients.inventory_entries).toBe(441)
    expect(ingredients.snapshot_entries).toBe(27)
    expect(ingredients.metric_source).toBe('supabase')
    expect(ingredients.validated_entries).toBe(0)
    expect(ingredients.progress_percent).toBe(0)
    expect(recipes.current_entries).toBe(302)
    expect(recipes.validated_entries).toBe(0)
    expect(recipes.progress_percent).toBe(0)
    expect(view.live_summary.planning_ready).toBe(124)
    expect(view.integration_status).toBe('blocked')
  })

  it('bloque l’intégration tant que les contenus des 48 volumes ne sont pas validés', () => {
    expect(index.summary.validated_volumes).toBe(0)
    expect(index.summary.drafted_books).toBe(1)
    expect(index.summary.validated_books).toBe(0)
    expect(index.summary.drafted_food_concepts).toBe(0)
    expect(index.summary.drafted_recipes).toBe(0)
    expect(index.summary.ready_for_integration).toBe(false)
    expect(index.coverage.find((volume) => volume.code === 'V00')).toMatchObject({
      inventory_entries: 1,
      drafted_entries: 1,
      validated_entries: 0,
      completion_status: 'draft',
    })
    expect(index.coverage.find((volume) => volume.code === 'V01').completion_status).toBe('inventory')
    expect(index.coverage.every((volume) => volume.completion_status !== 'validated')).toBe(true)
    expect(index.coverage.filter((volume) => volume.code !== 'V00').every(
      (volume) => volume.drafted_entries === 0,
    )).toBe(true)
    expect(index.coverage.every((volume) => volume.validated_entries === 0)).toBe(true)
  })
})
