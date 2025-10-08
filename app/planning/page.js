'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function PlanningPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Règles nutritionnelles de la diététicienne
  const nutritionRules = {
    // Répartition lipides dans la journée : max → moyen → min
    lipidsDistribution: {
      'petit-dejeuner': { target: 'high', percentage: 40, color: 'yellow' },
      'dejeuner': { target: 'medium', percentage: 30, color: 'orange' },  
      'diner': { target: 'low', percentage: 20, color: 'green' }
    },
    // Répartition glucides dans la journée : min → moyen → max
    carbsDistribution: {
      'petit-dejeuner': { target: 'low', percentage: 20, color: 'green' },
      'dejeuner': { target: 'medium', percentage: 30, color: 'orange' },
      'diner': { target: 'high', percentage: 40, color: 'yellow' }
    },
    // Desserts privilégiés : fruits et compotes
    preferredDesserts: ['fruits', 'compote', 'yaourt nature', 'fromage blanc'],
    // Équilibre obligatoire
    balanceRules: {
      fibersWithCarbs: true, // Si féculents → légumes/crudités
      fruitWithMeal: true    // Fruit en dessert recommandé
    }
  }

  const mealTypes = [
    { 
      id: 'petit-dejeuner', 
      name: 'Petit-déjeuner', 
      icon: '🌅',
      nutritionFocus: 'Riche en lipides, simple à préparer',
      guidelines: [
        '🥜 Privilégier : noix, avocat, œufs, beurre',
        '⚡ Préparation simple ou batch cooking',
        '🕐 Rapide à réaliser le matin'
      ]
    },
    { 
      id: 'dejeuner', 
      name: 'Déjeuner', 
      icon: '☀️',
      nutritionFocus: 'Équilibré, modéré en lipides',
      guidelines: [
        '⚖️ Équilibre protéines + légumes + féculents',
        '🥗 Crudités si plat riche en glucides',
        '🍎 Fruit frais en dessert privilégié'
      ]
    },
    { 
      id: 'diner', 
      name: 'Dîner', 
      icon: '🌙',
      nutritionFocus: 'Léger en lipides, plus de glucides',
      guidelines: [
        '🍝 Glucides acceptés (pâtes, riz, légumineuses)',
        '🥬 Légumes verts systématiques',  
        '🍇 Compote ou fruit cuit privilégié'
      ]
    }
  ]

  const components = [
    { 
      id: 'entree', 
      name: 'Entrée', 
      required: false, 
      categories: ['Entrées', 'Soupes', 'Salades'],
      nutritionRole: 'Apport fibres et vitamines'
    },
    { 
      id: 'principal', 
      name: 'Plat principal', 
      required: true, 
      categories: ['Plats principaux', 'Petit-déjeuner'],
      nutritionRole: 'Base protéines + équilibre macro'
    },
    { 
      id: 'dessert', 
      name: 'Dessert', 
      required: false, 
      categories: ['Desserts'],
      nutritionRole: 'Privilégier fruits et compotes'
    }
  ]

  const [nutritionMode, setNutritionMode] = useState('dietetician') // 'dietetician' | 'custom' | 'free'

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
    } catch (error) {
      console.error('Erreur auth:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  // Fonction d'évaluation nutritionnelle selon les règles diététiques
  function evaluateNutritionalCompliance(recipe, mealType, component) {
    if (!recipe || nutritionMode !== 'dietetician') return { score: 100, warnings: [] }
    
    const warnings = []
    let score = 100
    
    // Vérifier la répartition lipides
    const lipidRule = nutritionRules.lipidsDistribution[mealType]
    if (lipidRule && recipe.fats) {
      if (mealType === 'petit-dejeuner' && recipe.fats < 8) {
        warnings.push('⚠️ Petit-déj : privilégier plus de lipides (noix, avocat, œufs)')
        score -= 15
      }
      if (mealType === 'diner' && recipe.fats > 15) {
        warnings.push('⚠️ Dîner : limiter les lipides pour faciliter la digestion')
        score -= 10
      }
    }
    
    // Vérifier la répartition glucides
    const carbRule = nutritionRules.carbsDistribution[mealType]
    if (carbRule && recipe.carbs) {
      if (mealType === 'petit-dejeuner' && recipe.carbs > 30) {
        warnings.push('⚠️ Petit-déj : limiter les glucides complexes')
        score -= 10
      }
      if (mealType === 'diner' && recipe.carbs < 20) {
        warnings.push('💡 Dîner : les glucides sont acceptés (pâtes, riz)')
        score -= 5
      }
    }
    
    // Vérifier les desserts
    if (component === 'dessert') {
      const title = recipe.title.toLowerCase()
      const hasHealthyDessert = nutritionRules.preferredDesserts.some(dessert => 
        title.includes(dessert) || title.includes('fruit')
      )
      
      if (!hasHealthyDessert && (title.includes('chocolat') || title.includes('crème'))) {
        warnings.push('🍎 Privilégier fruits, compotes ou yaourts nature')
        score -= 20
      }
    }
    
    // Vérifier la simplicité pour petit-déjeuner
    if (mealType === 'petit-dejeuner' && recipe.prep_min && recipe.prep_min > 15) {
      warnings.push('⏰ Petit-déj : privilégier des préparations rapides ou batch cooking')
      score -= 10
    }
    
    return { score: Math.max(score, 0), warnings }
  }

  // Fonction pour suggérer l'équilibrage d'un repas
  function suggestMealBalance(mealPlan, mealType) {
    const suggestions = []
    
    if (!mealPlan.principal) {
      suggestions.push('🍽️ Ajouter un plat principal (obligatoire)')
      return suggestions
    }
    
    const mainDish = mealPlan.principal.recipe
    if (!mainDish) return suggestions
    
    // Si plat riche en glucides, suggérer des fibres
    if (mainDish.carbs > 25 && !mealPlan.entree) {
      suggestions.push('🥗 Ajouter des crudités ou légumes (équilibrage fibres)')
    }
    
    // Suggérer fruits en dessert
    if (!mealPlan.dessert) {
      const fruitSuggestion = mealType === 'diner' ? 'compote ou fruit cuit' : 'fruit frais'
      suggestions.push(`🍎 Ajouter un dessert : ${fruitSuggestion} recommandé`)
    }
    
    return suggestions
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        
        <div className="bg-white/30 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🍽️ Planning nutritionnel intelligent
              </h1>
              <p className="text-gray-600">Basé sur les recommandations diététiques professionnelles</p>
            </div>
            
            {/* Sélecteur de mode nutritionnel */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Mode :</label>
              <select 
                value={nutritionMode}
                onChange={(e) => setNutritionMode(e.target.value)}
                className="bg-white/80 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="dietetician">🩺 Diététicienne</option>
                <option value="custom">⚙️ Personnalisé</option>
                <option value="free">🆓 Libre</option>
              </select>
            </div>
          </div>
          
          {nutritionMode === 'dietetician' && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-green-800 mb-3">🩺 Règles diététiques appliquées :</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/60 rounded-lg p-3">
                  <h3 className="font-semibold text-yellow-700 mb-2">🥜 Lipides (graisses)</h3>
                  <div className="space-y-1 text-gray-700">
                    <div>• Matin : <span className="font-medium text-yellow-600">Maximum</span></div>
                    <div>• Midi : <span className="font-medium text-orange-600">Modéré</span></div>
                    <div>• Soir : <span className="font-medium text-green-600">Minimum</span></div>
                  </div>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                  <h3 className="font-semibold text-blue-700 mb-2">🍝 Glucides (féculents)</h3>
                  <div className="space-y-1 text-gray-700">
                    <div>• Matin : <span className="font-medium text-green-600">Minimum</span></div>
                    <div>• Midi : <span className="font-medium text-orange-600">Modéré</span></div>
                    <div>• Soir : <span className="font-medium text-yellow-600">Accepté</span></div>
                  </div>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                  <h3 className="font-semibold text-purple-700 mb-2">🍎 Équilibre</h3>
                  <div className="space-y-1 text-gray-700">
                    <div>• Dessert : fruits privilégiés</div>
                    <div>• Féculents → + légumes</div>
                    <div>• Petit-déj simple</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <h2 className="font-semibold text-blue-800 mb-2">💡 Structure des repas :</h2>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li><strong>Petit-déjeuner :</strong> 1 plat principal simple et riche en lipides</li>
              <li><strong>Déjeuner/Dîner :</strong> Plat principal <em className="text-red-600">obligatoire</em> + Entrée et dessert <em>optionnels</em></li>
              <li>🔄 Suggestions d'équilibrage automatiques selon les règles nutritionnelles</li>
              <li>🎯 Adaptation possible selon l'évolution des besoins</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-6">
          {mealTypes.map(meal => (
            <div key={meal.id} className="bg-white/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{meal.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{meal.name}</h3>
                    {nutritionMode === 'dietetician' && (
                      <p className="text-sm text-gray-600 mt-1">{meal.nutritionFocus}</p>
                    )}
                  </div>
                </div>
                
                {/* Indicateurs nutritionnels */}
                {nutritionMode === 'dietetician' && (
                  <div className="flex items-center space-x-2 text-xs">
                    <div className={`px-2 py-1 rounded-full bg-${nutritionRules.lipidsDistribution[meal.id]?.color}-100 text-${nutritionRules.lipidsDistribution[meal.id]?.color}-700`}>
                      🥜 {nutritionRules.lipidsDistribution[meal.id]?.target}
                    </div>
                    <div className={`px-2 py-1 rounded-full bg-${nutritionRules.carbsDistribution[meal.id]?.color}-100 text-${nutritionRules.carbsDistribution[meal.id]?.color}-700`}>
                      🍝 {nutritionRules.carbsDistribution[meal.id]?.target}
                    </div>
                  </div>
                )}
              </div>

              {/* Guidelines nutritionnelles */}
              {nutritionMode === 'dietetician' && meal.guidelines && (
                <div className="bg-gradient-to-r from-blue-50/80 to-green-50/80 border border-blue-200 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Recommandations :</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    {meal.guidelines.map((guideline, idx) => (
                      <li key={idx}>{guideline}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {components.map(component => {
                  if (meal.id === 'petit-dejeuner' && component.id !== 'principal') {
                    return null
                  }
                  
                  return (
                    <div 
                      key={component.id} 
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        component.required 
                          ? 'border-red-300 bg-red-50/50' 
                          : 'border-gray-300 bg-gray-50/50 hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      <div className="font-medium text-gray-700 mb-2">
                        {component.name}
                        {component.required ? (
                          <span className="text-red-500 ml-1">*</span>
                        ) : (
                          <span className="text-gray-400 text-sm ml-1">(opt.)</span>
                        )}
                      </div>
                      
                      {nutritionMode === 'dietetician' && component.nutritionRole && (
                        <div className="text-xs text-purple-600 mb-2 italic">
                          {component.nutritionRole}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-600 mb-3">
                        Catégories : {component.categories.join(', ')}
                      </div>
                      
                      <button className="w-full py-2 px-4 text-sm bg-white/60 hover:bg-white/80 rounded-lg border border-white/40 transition-colors">
                        + Ajouter une recette
                      </button>
                      
                      {component.required && (
                        <div className="text-xs text-red-600 mt-2">
                          Obligatoire pour un repas complet
                        </div>
                      )}
                      
                      {/* Suggestions spécifiques par composant */}
                      {nutritionMode === 'dietetician' && component.id === 'dessert' && (
                        <div className="text-xs text-green-600 mt-2 bg-green-50 rounded p-2">
                          🍎 Privilégier : {nutritionRules.preferredDesserts.join(', ')}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Suggestions d'équilibrage (simulées pour l'exemple) */}
              {nutritionMode === 'dietetician' && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-amber-800 mb-2">⚖️ Suggestions d'équilibrage :</h4>
                  <div className="text-xs text-amber-700 space-y-1">
                    {meal.id === 'dejeuner' && (
                      <>
                        <div>• Si pâtes/riz au plat principal → Ajouter salade verte en entrée</div>
                        <div>• Privilégier fruit frais en dessert pour les fibres</div>
                      </>
                    )}
                    {meal.id === 'diner' && (
                      <>
                        <div>• Légumes verts recommandés à chaque dîner</div>
                        <div>• Compote ou fruit cuit préférable au dessert riche</div>
                      </>
                    )}
                    {meal.id === 'petit-dejeuner' && (
                      <>
                        <div>• Préparer la veille ou le weekend (batch cooking)</div>
                        <div>• Ajouter noix, graines ou avocat pour les lipides</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">🌿 Philosophie Myko :</h4>
            <p className="text-green-700 text-sm mb-3">
              Système nutritionnel intelligent basé sur les recommandations professionnelles, 
              tout en gardant flexibilité et plaisir culinaire.
            </p>
            <div className="text-xs text-green-600 space-y-1">
              <div>✅ Respecte les rythmes biologiques</div>
              <div>✅ Favorise la digestion optimale</div>
              <div>✅ Maintient l'équilibre nutritionnel</div>
              <div>✅ S'adapte aux contraintes du quotidien</div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-2">⚙️ Évolution du système :</h4>
            <p className="text-purple-700 text-sm mb-3">
              Les règles nutritionnelles peuvent être personnalisées selon l'évolution de vos besoins.
            </p>
            <div className="text-xs text-purple-600 space-y-1">
              <div>🔄 Mode "Diététicienne" : règles professionnelles</div>
              <div>🎛️ Mode "Personnalisé" : ajustez vos priorités</div>
              <div>🆓 Mode "Libre" : planning sans contraintes</div>
              <div>📊 Suivi des progrès et adaptations</div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🚀 Fonctionnalités à venir :</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-blue-700 text-sm space-y-1">
              <li>✅ Règles nutritionnelles intégrées</li>
              <li>✅ Structure des repas complets</li>
              <li>✅ Base de 500 recettes avec métadonnées</li>
              <li>🔄 Système d'évaluation nutritionnelle</li>
            </ul>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>⏳ Sélection intelligente de recettes</li>
              <li>⏳ Score de conformité diététique</li>
              <li>⏳ Suggestions d'équilibrage automatiques</li>
              <li>⏳ Liste de courses optimisée</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
