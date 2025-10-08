'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function RecipesPage() {
  const router = useRouter()
  const [recipes, setRecipes] = useState([])
  const [filteredRecipes, setFilteredRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [cuisineFilter, setCuisineFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [dietaryFilter, setDietaryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('myko_score')
  const [sortOrder, setSortOrder] = useState('desc')
  const [categories, setCategories] = useState([])
  const [cuisines, setCuisines] = useState([])

  useEffect(() => {
    checkAuth()
    fetchRecipes()
    fetchFilters()
  }, [])

  useEffect(() => {
    filterAndSortRecipes()
  }, [recipes, searchTerm, categoryFilter, cuisineFilter, difficultyFilter, dietaryFilter, sortBy, sortOrder])

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    }
  }

  async function fetchRecipes() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('recipes_complete') // Utilise notre vue intelligente
        .select('*')
        .eq('is_active', true)
        .order('myko_score', { ascending: false })

      if (error) throw error
      setRecipes(data || [])
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchFilters() {
    try {
      // Récupérer les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('recipe_categories')
        .select('*')
        .order('sort_order')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Récupérer les types de cuisine
      const { data: cuisinesData, error: cuisinesError } = await supabase
        .from('cuisine_types')
        .select('*')
        .order('name')

      if (cuisinesError) throw cuisinesError
      setCuisines(cuisinesData || [])

    } catch (error) {
      console.error('Error fetching filters:', error)
    }
  }

  function filterAndSortRecipes() {
    let filtered = [...recipes]

    // Filtrage par texte
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(recipe =>
        recipe.title?.toLowerCase().includes(term) ||
        recipe.description?.toLowerCase().includes(term) ||
        recipe.short_description?.toLowerCase().includes(term)
      )
    }

    // Filtrage par catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(recipe => recipe.category_name === categoryFilter)
    }

    // Filtrage par cuisine
    if (cuisineFilter !== 'all') {
      filtered = filtered.filter(recipe => recipe.cuisine_name === cuisineFilter)
    }

    // Filtrage par difficulté
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(recipe => recipe.difficulty_level === difficultyFilter)
    }

    // Filtrage par régime alimentaire
    if (dietaryFilter !== 'all') {
      filtered = filtered.filter(recipe => {
        switch (dietaryFilter) {
          case 'vegetarian':
            return recipe.is_vegetarian
          case 'vegan':
            return recipe.is_vegan
          case 'gluten_free':
            return recipe.is_gluten_free
          case 'dairy_free':
            return recipe.is_dairy_free
          default:
            return true
        }
      })
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '')
          break
        case 'myko_score':
          comparison = (b.myko_score || 0) - (a.myko_score || 0)
          break
        case 'total_time_min':
          comparison = (a.total_time_min || 0) - (b.total_time_min || 0)
          break
        case 'inventory_availability_percent':
          comparison = (b.inventory_availability_percent || 0) - (a.inventory_availability_percent || 0)
          break
        case 'expiring_ingredients_count':
          comparison = (b.expiring_ingredients_count || 0) - (a.expiring_ingredients_count || 0)
          break
        default:
          comparison = 0
      }
      
      return sortOrder === 'desc' ? comparison : -comparison
    })

    setFilteredRecipes(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des recettes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🍽️ Recettes Myko
              </h1>
              <p className="text-gray-600">
                {filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''} 
                {recipes.length > 0 && ` sur ${recipes.length}`}
              </p>
            </div>
            
            <Link
              href="/recipes/new"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
            >
              <span className="mr-2">+</span>
              Nouvelle recette
            </Link>
          </div>

          {/* Barre de recherche */}
          <div className="bg-white/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              {/* Recherche */}
              <div className="lg:col-span-2">
                <input
                  type="text"
                  placeholder="Rechercher une recette..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Catégorie */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Toutes catégories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>

              {/* Cuisine */}
              <select
                value={cuisineFilter}
                onChange={(e) => setCuisineFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Toutes cuisines</option>
                {cuisines.map(cuisine => (
                  <option key={cuisine.id} value={cuisine.name}>
                    {cuisine.flag} {cuisine.name}
                  </option>
                ))}
              </select>

              {/* Régime */}
              <select
                value={dietaryFilter}
                onChange={(e) => setDietaryFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tous régimes</option>
                <option value="vegetarian">🌱 Végétarien</option>
                <option value="vegan">🌿 Végétalien</option>
                <option value="gluten_free">🌾 Sans gluten</option>
                <option value="dairy_free">🥛 Sans lactose</option>
              </select>

              {/* Tri */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500"
              >
                <option value="myko_score">🌿 Score Myko</option>
                <option value="inventory_availability_percent">📦 Disponibilité</option>
                <option value="expiring_ingredients_count">⚠️ Anti-gaspi</option>
                <option value="title">📝 Nom</option>
                <option value="total_time_min">⏱️ Temps</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid des recettes */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune recette trouvée</h3>
            <p className="text-gray-600 mb-6">Essayez de modifier vos filtres ou créez une nouvelle recette</p>
            <Link
              href="/recipes/new"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              Créer une recette
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group block"
              >
                <div className="bg-white/40 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/60 transition-all duration-200 h-full">
                  
                  {/* Header avec score et badges */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Score Myko */}
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                          🌿 {recipe.myko_score || 0}
                        </div>
                        
                        {/* Disponibilité inventory */}
                        {recipe.inventory_availability_percent > 0 && (
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            recipe.inventory_availability_percent >= 80
                              ? 'bg-green-100 text-green-800'
                              : recipe.inventory_availability_percent >= 50
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            📦 {recipe.inventory_availability_percent}%
                          </div>
                        )}

                        {/* Anti-gaspi */}
                        {recipe.expiring_ingredients_count > 0 && (
                          <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold">
                            ⚠️ {recipe.expiring_ingredients_count}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-700 transition-colors line-clamp-2">
                        {recipe.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {recipe.short_description || recipe.description}
                  </p>

                  {/* Métadonnées */}
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        {recipe.category_icon} {recipe.category_name}
                      </span>
                      <span className="text-gray-500">
                        {recipe.cuisine_flag} {recipe.cuisine_name}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>⏱️ {recipe.total_time_min || 0} min</span>
                      <span>🍽️ {recipe.servings} portions</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>📊 {recipe.difficulty_name}</span>
                      <div className="flex gap-1">
                        {recipe.is_vegetarian && <span title="Végétarien">🌱</span>}
                        {recipe.is_vegan && <span title="Végétalien">🌿</span>}
                        {recipe.is_gluten_free && <span title="Sans gluten">🌾</span>}
                        {recipe.is_dairy_free && <span title="Sans lactose">🥛</span>}
                      </div>
                    </div>
                  </div>

                  {/* Informations nutritionnelles */}
                  {recipe.calories_per_serving && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50">
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>🔥 {Math.round(recipe.calories_per_serving)} kcal</div>
                        <div>🥩 {Math.round(recipe.proteins_per_serving || 0)}g prot.</div>
                        <div>🌾 {Math.round(recipe.carbs_per_serving || 0)}g gluc.</div>
                        <div>🥑 {Math.round(recipe.fats_per_serving || 0)}g lipides</div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}