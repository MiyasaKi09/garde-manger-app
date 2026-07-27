import { describe, expect, it } from 'vitest'
import manifest from '@/data/encyclopedia/manifest.json'
import index from '@/data/encyclopedia/index.json'
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

  it('donne un contrat complet à chaque livre', () => {
    const books = manifest.volumes.flatMap((volume) => volume.books)
    expect(new Set(books.map((book) => book.code)).size).toBe(books.length)
    for (const book of books) {
      expect(book.mission, book.code).toBeTruthy()
      expect(book.required_fields.length, book.code).toBeGreaterThan(0)
      expect(book.quality_gates.length, book.code).toBeGreaterThan(0)
      expect(Array.isArray(book.source_contracts), book.code).toBe(true)
    }
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

  it('fusionne les agrégats live sans perdre le snapshot versionné', () => {
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
    expect(ingredients.snapshot_entries).toBe(27)
    expect(ingredients.metric_source).toBe('supabase')
    expect(recipes.current_entries).toBe(302)
    expect(view.live_summary.planning_ready).toBe(124)
  })
})
