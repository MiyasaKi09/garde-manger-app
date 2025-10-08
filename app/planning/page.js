'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function PlanningPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const mealTypes = [
    { id: 'petit-dejeuner', name: 'Petit-déjeuner', icon: '🌅' },
    { id: 'dejeuner', name: 'Déjeuner', icon: '☀️' },
    { id: 'diner', name: 'Dîner', icon: '🌙' }
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
        
        <div className="bg-white/30 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🍽️ Planning des repas complets
          </h1>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <h2 className="font-semibold text-blue-800 mb-2">💡 Logique des repas complets :</h2>
            <ul className="text-blue-700 space-y-1">
              <li><strong>Petit-déjeuner :</strong> Un plat principal (ex: pancakes, porridge)</li>
              <li><strong>Déjeuner/Dîner :</strong> Plat principal <em className="text-red-600">obligatoire</em> + Entrée et dessert <em>optionnels</em></li>
              <li>🔄 Chaque composant peut être planifié séparément</li>
              <li>🎯 Focus sur l équilibre et la variété des repas</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-6">
          {mealTypes.map(meal => (
            <div key={meal.id} className="bg-white/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">{meal.icon}</span>
                <h3 className="text-xl font-semibold text-gray-800">{meal.name}</h3>
              </div>
              
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
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">🌿 Philosophie Myko :</h4>
          <p className="text-green-700 text-sm">
            Cette approche permet de planifier des repas équilibrés tout en gardant de la flexibilité. 
            L entrée devient un "plus" pour les occasions spéciales, le plat principal assure la satiété, 
            et le dessert apporte le plaisir. Parfait pour optimiser les courses et réduire le gaspillage !
          </p>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🚀 Prochaines étapes :</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>✅ Structure des repas complets définie</li>
            <li>🔄 Base de données de 500 recettes générée</li>
            <li>⏳ Intégration du système de sélection de recettes</li>
            <li>⏳ Calcul automatique du score Myko par repas</li>
            <li>⏳ Génération de liste de courses intelligente</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
