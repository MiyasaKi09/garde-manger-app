'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function PlanningPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nutritionMode, setNutritionMode] = useState('dietetician')

  // Règles nutritionnelles simplifiées
  const nutritionRules = {
    lipidsDistribution: {
      'petit-dejeuner': { target: 'Maximum', color: 'yellow' },
      'dejeuner': { target: 'Modéré', color: 'orange' },  
      'diner': { target: 'Minimum', color: 'green' }
    },
    carbsDistribution: {
      'petit-dejeuner': { target: 'Minimum', color: 'green' },
      'dejeuner': { target: 'Modéré', color: 'orange' },
      'diner': { target: 'Accepté', color: 'yellow' }
    }
  }

  const mealTypes = [
    { 
      id: 'petit-dejeuner', 
      name: 'Petit-déjeuner', 
      icon: '🌅',
      focus: 'Riche en lipides, simple à préparer',
      tips: ['🥜 Privilégier noix, avocat, œufs', '⚡ Préparation rapide ou batch cooking']
    },
    { 
      id: 'dejeuner', 
      name: 'Déjeuner', 
      icon: '☀️',
      focus: 'Équilibré, modéré en lipides',
      tips: ['⚖️ Équilibre protéines + légumes + féculents', '🍎 Fruit frais en dessert']
    },
    { 
      id: 'diner', 
      name: 'Dîner', 
      icon: '🌙',
      focus: 'Léger en lipides, glucides acceptés',
      tips: ['🍝 Glucides OK (pâtes, riz)', '🥬 Légumes verts systématiques']
    }
  ]

  const components = [
    { id: 'entree', name: 'Entrée', required: false, categories: ['Entrées'] },
    { id: 'principal', name: 'Plat principal', required: true, categories: ['Plats principaux'] },
    { id: 'dessert', name: 'Dessert', required: false, categories: ['Desserts'] }
  ]

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
        
        {/* En-tête avec sélecteur de mode */}
        <div className="bg-white bg-opacity-30 backdrop-blur-md rounded-xl p-6 mb-8 border border-white border-opacity-20">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🍽️ Planning nutritionnel intelligent
              </h1>
              <p className="text-gray-600">Basé sur les recommandations diététiques</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Mode :</label>
              <select 
                value={nutritionMode}
                onChange={(e) => setNutritionMode(e.target.value)}
                className="bg-white bg-opacity-80 border border-gray-200 rounded-lg px-3 py-2 text-sm"
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
                <div className="bg-white bg-opacity-60 rounded-lg p-3">
                  <h3 className="font-semibold text-yellow-700 mb-2">🥜 Lipides</h3>
                  <div className="space-y-1 text-gray-700">
                    <div>• Matin : <span className="font-medium text-yellow-600">Maximum</span></div>
                    <div>• Midi : <span className="font-medium text-orange-600">Modéré</span></div>
                    <div>• Soir : <span className="font-medium text-green-600">Minimum</span></div>
                  </div>
                </div>
                <div className="bg-white bg-opacity-60 rounded-lg p-3">
                  <h3 className="font-semibold text-blue-700 mb-2">🍝 Glucides</h3>
                  <div className="space-y-1 text-gray-700">
                    <div>• Matin : <span className="font-medium text-green-600">Minimum</span></div>
                    <div>• Midi : <span className="font-medium text-orange-600">Modéré</span></div>
                    <div>• Soir : <span className="font-medium text-yellow-600">Accepté</span></div>
                  </div>
                </div>
                <div className="bg-white bg-opacity-60 rounded-lg p-3">
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
        </div>

        {/* Grille des repas */}
        <div className="grid gap-6">
          {mealTypes.map(meal => (
            <div key={meal.id} className="bg-white bg-opacity-30 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{meal.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{meal.name}</h3>
                    {nutritionMode === 'dietetician' && (
                      <p className="text-sm text-gray-600 mt-1">{meal.focus}</p>
                    )}
                  </div>
                </div>
                
                {/* Indicateurs nutritionnels */}
                {nutritionMode === 'dietetician' && (
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                      🥜 {nutritionRules.lipidsDistribution[meal.id]?.target}
                    </div>
                    <div className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      🍝 {nutritionRules.carbsDistribution[meal.id]?.target}
                    </div>
                  </div>
                )}
              </div>

              {/* Conseils nutritionnels */}
              {nutritionMode === 'dietetician' && meal.tips && (
                <div className="bg-blue-50 bg-opacity-80 border border-blue-200 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Conseils :</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    {meal.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Composants du repas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {components.map(component => {
                  // Petit-déjeuner = seulement plat principal
                  if (meal.id === 'petit-dejeuner' && component.id !== 'principal') {
                    return null
                  }
                  
                  return (
                    <div 
                      key={component.id} 
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        component.required 
                          ? 'border-red-300 bg-red-50 bg-opacity-50' 
                          : 'border-gray-300 bg-gray-50 bg-opacity-50 hover:border-green-300 hover:bg-green-50'
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
                      
                      <div className="text-sm text-gray-600 mb-3">
                        {component.categories.join(', ')}
                      </div>
                      
                      <button className="w-full py-2 px-4 text-sm bg-white bg-opacity-60 hover:bg-white hover:bg-opacity-80 rounded-lg border border-white border-opacity-40 transition-colors">
                        + Ajouter une recette
                      </button>
                      
                      {component.required && (
                        <div className="text-xs text-red-600 mt-2">
                          Obligatoire pour un repas complet
                        </div>
                      )}
                      
                      {/* Suggestions spéciales pour dessert */}
                      {nutritionMode === 'dietetician' && component.id === 'dessert' && (
                        <div className="text-xs text-green-600 mt-2 bg-green-50 rounded p-2">
                          🍎 Privilégier fruits, compotes, yaourts nature
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Suggestions d'équilibrage */}
              {nutritionMode === 'dietetician' && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-amber-800 mb-2">⚖️ Suggestions d'équilibrage :</h4>
                  <div className="text-xs text-amber-700 space-y-1">
                    {meal.id === 'dejeuner' && (
                      <>
                        <div>• Si pâtes/riz → Ajouter salade verte en entrée</div>
                        <div>• Privilégier fruit frais en dessert</div>
                      </>
                    )}
                    {meal.id === 'diner' && (
                      <>
                        <div>• Légumes verts recommandés</div>
                        <div>• Compote préférable aux desserts riches</div>
                      </>
                    )}
                    {meal.id === 'petit-dejeuner' && (
                      <>
                        <div>• Préparation simple ou batch cooking</div>
                        <div>• Ajouter noix/avocat pour les lipides</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Section informative */}
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
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">🚀 Évolution :</h4>
            <p className="text-blue-700 text-sm mb-3">
              Les règles peuvent être personnalisées selon vos besoins.
            </p>
            <div className="text-xs text-blue-600 space-y-1">
              <div>🩺 Mode Diététicienne : règles pro</div>
              <div>⚙️ Mode Personnalisé : à venir</div>
              <div>🆓 Mode Libre : sans contraintes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}