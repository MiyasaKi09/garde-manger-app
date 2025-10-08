'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function PlanningPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [weekDates, setWeekDates] = useState([])
  const [planning, setPlanning] = useState({})
  const [selectedDay, setSelectedDay] = useState(null)
  const [nutritionMode, setNutritionMode] = useState('dietetician')

  const mealTypes = [
    { id: 'petit-dejeuner', name: 'Petit-déj', icon: '🌅', shortName: 'P-déj', color: '#fef3c7' },
    { id: 'dejeuner', name: 'Déjeuner', icon: '☀️', shortName: 'Déj', color: '#fde68a' },
    { id: 'diner', name: 'Dîner', icon: '🌙', shortName: 'Dîner', color: '#e0e7ff' }
  ]

  const nutritionRules = {
    'petit-dejeuner': { lipids: 'Max', carbs: 'Min', tips: 'Simple et riche en lipides' },
    'dejeuner': { lipids: 'Mod', carbs: 'Mod', tips: 'Équilibré et complet' },
    'diner': { lipids: 'Min', carbs: 'OK', tips: 'Léger, légumes privilégiés' }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    generateWeekDates()
  }, [currentWeek])

  useEffect(() => {
    if (user && weekDates.length > 0) {
      loadPlanning()
    }
  }, [user, weekDates])

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

  function generateWeekDates() {
    const dates = []
    const startOfWeek = new Date(currentWeek)
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1) // Lundi

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    setWeekDates(dates)
  }

  async function loadPlanning() {
    // Simuler des données pour l'exemple
    const mockPlanning = {}
    weekDates.forEach(date => {
      const dateKey = date.toISOString().split('T')[0]
      mockPlanning[dateKey] = {
        'petit-dejeuner': Math.random() > 0.7 ? { recipe: 'Porridge aux fruits', status: 'planifie' } : null,
        'dejeuner': Math.random() > 0.4 ? { recipe: 'Salade César au poulet', status: 'planifie' } : null,
        'diner': Math.random() > 0.3 ? { recipe: 'Pâtes à la bolognaise', status: 'planifie' } : null
      }
    })
    setPlanning(mockPlanning)
  }

  function navigateWeek(direction) {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() + (direction * 7))
    setCurrentWeek(newWeek)
  }

  function getDayPlanning(date) {
    const dateKey = date.toISOString().split('T')[0]
    return planning[dateKey] || {}
  }

  function getMealCount(dayPlan) {
    return Object.values(dayPlan).filter(meal => meal?.recipe).length
  }

  function isToday(date) {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  function formatDate(date) {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short'
    })
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
      <div className="max-w-7xl mx-auto">
        
        {/* En-tête avec navigation */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🗓️ Planning de la semaine
              </h1>
              <p className="text-gray-600">
                Organisez vos repas selon les règles nutritionnelles
              </p>
            </div>

            {/* Mode nutritionnel */}
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Mode :</label>
              <select 
                value={nutritionMode}
                onChange={(e) => setNutritionMode(e.target.value)}
                className="bg-white/80 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="dietetician">🩺 Diététicienne</option>
                <option value="custom">⚙️ Personnalisé</option>
                <option value="free">🆓 Libre</option>
              </select>
            </div>
          </div>

          {/* Navigation semaine */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateWeek(-1)}
              className="glass-button px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              ← Semaine précédente
            </button>
            
            <div className="text-center">
              <h2 className="font-semibold text-lg text-gray-800">
                {weekDates[0]?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - 
                {weekDates[6]?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-sm text-gray-600">Semaine {Math.ceil(((currentWeek - new Date(currentWeek.getFullYear(), 0, 1)) / 86400000 + 1) / 7)}</p>
            </div>
            
            <button
              onClick={() => navigateWeek(1)}
              className="glass-button px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              Semaine suivante →
            </button>
          </div>
        </div>

        {/* Vue grille hebdomadaire */}
        <div className="glass-card rounded-xl p-6 mb-6">
          
          {/* En-tête des jours */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="p-3 text-center font-medium text-gray-700">
              Repas
            </div>
            {weekDates.map((date, index) => (
              <div 
                key={index} 
                className={`p-3 text-center rounded-lg transition-colors cursor-pointer ${
                  isToday(date) 
                    ? 'bg-green-100 border-2 border-green-300' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                onClick={() => setSelectedDay(selectedDay === date.getTime() ? null : date.getTime())}
              >
                <div className="font-medium text-gray-800 text-sm">
                  {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {date.getDate()}
                </div>
                {isToday(date) && (
                  <div className="text-xs text-green-600 font-medium">Aujourd'hui</div>
                )}
              </div>
            ))}
          </div>

          {/* Grille des repas */}
          {mealTypes.map(meal => (
            <div key={meal.id} className="grid grid-cols-8 gap-2 mb-3">
              
              {/* Label du repas */}
              <div className="flex items-center justify-center p-3 rounded-lg bg-white/30">
                <div className="text-center">
                  <div className="text-lg mb-1">{meal.icon}</div>
                  <div className="text-sm font-medium text-gray-700">{meal.shortName}</div>
                  {nutritionMode === 'dietetician' && (
                    <div className="text-xs text-gray-500 mt-1">
                      🥜{nutritionRules[meal.id].lipids} 🍝{nutritionRules[meal.id].carbs}
                    </div>
                  )}
                </div>
              </div>

              {/* Cases repas par jour */}
              {weekDates.map(date => {
                const dayPlan = getDayPlanning(date)
                const mealPlan = dayPlan[meal.id]
                const isSelected = selectedDay === date.getTime()
                
                return (
                  <div 
                    key={`${meal.id}-${date.getTime()}`}
                    className={`p-2 rounded-lg border-2 border-dashed transition-all cursor-pointer min-h-[80px] ${
                      mealPlan 
                        ? 'border-green-300 bg-green-50/70 hover:bg-green-100/70' 
                        : 'border-gray-300 bg-white/20 hover:border-green-400 hover:bg-green-50/30'
                    } ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
                    onClick={() => setSelectedDay(selectedDay === date.getTime() ? null : date.getTime())}
                  >
                    {mealPlan ? (
                      <div className="text-center">
                        <div className="text-xs font-medium text-green-800 leading-tight">
                          {mealPlan.recipe}
                        </div>
                        <div className="mt-1">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        <span>+ Ajouter</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Détails du jour sélectionné */}
        {selectedDay && (
          <div className="glass-card rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                📅 {new Date(selectedDay).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Fermer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mealTypes.map(meal => {
                const dayPlan = getDayPlanning(new Date(selectedDay))
                const mealPlan = dayPlan[meal.id]
                
                return (
                  <div 
                    key={meal.id}
                    className="border-2 border-dashed rounded-lg p-4 text-center transition-colors"
                    style={{ 
                      borderColor: mealPlan ? '#10b981' : '#d1d5db',
                      backgroundColor: mealPlan ? '#f0fdf4' : '#f9fafb'
                    }}
                  >
                    <div className="text-2xl mb-2">{meal.icon}</div>
                    <div className="font-medium text-gray-800 mb-2">{meal.name}</div>
                    
                    {nutritionMode === 'dietetician' && (
                      <div className="text-xs text-gray-600 mb-3 p-2 bg-blue-50 rounded">
                        {nutritionRules[meal.id].tips}
                      </div>
                    )}
                    
                    {mealPlan ? (
                      <div className="space-y-3">
                        <div className="font-medium text-green-800">
                          {mealPlan.recipe}
                        </div>
                        <div className="flex space-x-2">
                          <button className="flex-1 py-2 px-3 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                            Modifier
                          </button>
                          <button className="flex-1 py-2 px-3 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                            Retirer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="w-full py-3 px-4 text-sm bg-white/60 hover:bg-white/80 rounded-lg border border-white/40 transition-colors">
                        + Choisir une recette
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Suggestions nutritionnelles pour le jour */}
            {nutritionMode === 'dietetician' && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">💡 Conseils pour cette journée :</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div>• Vérifiez l'équilibre lipides/glucides selon les moments</div>
                  <div>• Privilégiez les fruits en dessert</div>
                  <div>• Ajoutez des légumes si féculents prévus</div>
                  <div>• Préparez le petit-déjeuner la veille si possible</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Résumé hebdomadaire */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-2">📊 Cette semaine</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Repas planifiés :</span>
                <span className="font-medium text-green-600">
                  {Object.values(planning).reduce((total, day) => 
                    total + getMealCount(day), 0
                  )} / {weekDates.length * 3}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Taux de planification :</span>
                <span className="font-medium text-blue-600">
                  {Math.round((Object.values(planning).reduce((total, day) => 
                    total + getMealCount(day), 0) / (weekDates.length * 3)) * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-2">🎯 Actions rapides</h4>
            <div className="space-y-2">
              <button className="w-full py-2 px-3 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                Planifier automatiquement
              </button>
              <button className="w-full py-2 px-3 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                Générer liste courses
              </button>
              <button className="w-full py-2 px-3 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200">
                Dupliquer semaine
              </button>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-2">🌿 Score Myko</h4>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">85/100</div>
              <div className="text-xs text-gray-600">Excellent équilibre nutritionnel</div>
              <div className="mt-2 text-xs text-green-700">
                ✅ Variété respectée<br/>
                ✅ Règles diététiques suivies<br/>
                ⚠️ Manque 2 petits-déjeuners
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .glass-button {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}