'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function PlanningPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nutritionMode, setNutritionMode] = useState('dietetician')

  const mealTypes = [
    { 
      id: 'petit-dejeuner', 
      name: 'Petit-déjeuner', 
      icon: '🌅',
      focus: 'Riche en lipides, simple à préparer',
      tips: ['🥜 Privilégier noix, avocat, œufs', '⚡ Préparation rapide']
    },
    { 
      id: 'dejeuner', 
      name: 'Déjeuner', 
      icon: '☀️',
      focus: 'Équilibré, modéré en lipides',
      tips: ['⚖️ Équilibre protéines + légumes', '🍎 Fruit frais en dessert']
    },
    { 
      id: 'diner', 
      name: 'Dîner', 
      icon: '🌙',
      focus: 'Léger en lipides, glucides acceptés',
      tips: ['🍝 Glucides OK (pâtes, riz)', '🥬 Légumes verts']
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #059669',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dbeafe 100%)',
    padding: '16px'
  }

  const maxWidthStyle = {
    maxWidth: '1152px',
    margin: '0 auto'
  }

  const headerCardStyle = {
    background: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(16px)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  }

  const mealCardStyle = {
    background: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(16px)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginTop: '16px'
  }

  const componentCardStyle = (required) => ({
    border: required ? '2px dashed #fca5a5' : '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    background: required ? 'rgba(254, 226, 226, 0.5)' : 'rgba(249, 250, 251, 0.5)',
    transition: 'all 0.2s',
    cursor: 'pointer'
  })

  const buttonStyle = {
    width: '100%',
    padding: '8px 16px',
    fontSize: '14px',
    background: 'rgba(255, 255, 255, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }

  return (
    <div style={containerStyle}>
      <div style={maxWidthStyle}>
        
        {/* En-tête */}
        <div style={headerCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                🍽️ Planning nutritionnel intelligent
              </h1>
              <p style={{ color: '#6b7280' }}>Basé sur les recommandations diététiques</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Mode :</label>
              <select 
                value={nutritionMode}
                onChange={(e) => setNutritionMode(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '14px'
                }}
              >
                <option value="dietetician">🩺 Diététicienne</option>
                <option value="custom">⚙️ Personnalisé</option>
                <option value="free">🆓 Libre</option>
              </select>
            </div>
          </div>
          
          {nutritionMode === 'dietetician' && (
            <div style={{
              background: 'linear-gradient(to right, #f0fdf4, #dbeafe)',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontWeight: '600', color: '#065f46', marginBottom: '12px' }}>🩺 Règles diététiques appliquées :</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.6)', borderRadius: '8px', padding: '12px' }}>
                  <h3 style={{ fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>🥜 Lipides</h3>
                  <div style={{ color: '#374151' }}>
                    <div>• Matin : <span style={{ fontWeight: '500', color: '#d97706' }}>Maximum</span></div>
                    <div>• Midi : <span style={{ fontWeight: '500', color: '#ea580c' }}>Modéré</span></div>
                    <div>• Soir : <span style={{ fontWeight: '500', color: '#059669' }}>Minimum</span></div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.6)', borderRadius: '8px', padding: '12px' }}>
                  <h3 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>🍝 Glucides</h3>
                  <div style={{ color: '#374151' }}>
                    <div>• Matin : <span style={{ fontWeight: '500', color: '#059669' }}>Minimum</span></div>
                    <div>• Midi : <span style={{ fontWeight: '500', color: '#ea580c' }}>Modéré</span></div>
                    <div>• Soir : <span style={{ fontWeight: '500', color: '#d97706' }}>Accepté</span></div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.6)', borderRadius: '8px', padding: '12px' }}>
                  <h3 style={{ fontWeight: '600', color: '#7c2d12', marginBottom: '8px' }}>🍎 Équilibre</h3>
                  <div style={{ color: '#374151' }}>
                    <div>• Dessert : fruits privilégiés</div>
                    <div>• Féculents → + légumes</div>
                    <div>• Petit-déj simple</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Repas */}
        {mealTypes.map(meal => (
          <div key={meal.id} style={mealCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '32px', marginRight: '12px' }}>{meal.icon}</span>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>{meal.name}</h3>
                  {nutritionMode === 'dietetician' && (
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{meal.focus}</p>
                  )}
                </div>
              </div>
              
              {nutritionMode === 'dietetician' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '9999px',
                    background: '#fef3c7',
                    color: '#92400e'
                  }}>
                    🥜 Max/Mod/Min
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '9999px',
                    background: '#dbeafe',
                    color: '#1e40af'
                  }}>
                    🍝 Min/Mod/Max
                  </div>
                </div>
              )}
            </div>

            {/* Conseils */}
            {nutritionMode === 'dietetician' && meal.tips && (
              <div style={{
                background: 'rgba(219, 234, 254, 0.8)',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>💡 Conseils :</h4>
                <ul style={{ fontSize: '12px', color: '#1e40af', margin: 0, paddingLeft: '16px' }}>
                  {meal.tips.map((tip, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Composants du repas */}
            <div style={gridStyle}>
              {components.map(component => {
                // Petit-déjeuner = seulement plat principal
                if (meal.id === 'petit-dejeuner' && component.id !== 'principal') {
                  return null
                }
                
                return (
                  <div 
                    key={component.id} 
                    style={componentCardStyle(component.required)}
                  >
                    <div style={{ fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      {component.name}
                      {component.required ? (
                        <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '4px' }}>(opt.)</span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                      {component.categories.join(', ')}
                    </div>
                    
                    <button style={buttonStyle}>
                      + Ajouter une recette
                    </button>
                    
                    {component.required && (
                      <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>
                        Obligatoire pour un repas complet
                      </div>
                    )}
                    
                    {nutritionMode === 'dietetician' && component.id === 'dessert' && (
                      <div style={{
                        fontSize: '12px',
                        color: '#059669',
                        marginTop: '8px',
                        background: '#f0fdf4',
                        borderRadius: '4px',
                        padding: '8px'
                      }}>
                        🍎 Privilégier fruits, compotes, yaourts nature
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Suggestions d'équilibrage */}
            {nutritionMode === 'dietetician' && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '8px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>⚖️ Suggestions :</h4>
                <div style={{ fontSize: '12px', color: '#92400e' }}>
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

        {/* Footer informatif */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h4 style={{ fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>🌿 Philosophie Myko :</h4>
            <p style={{ color: '#047857', fontSize: '14px', marginBottom: '12px' }}>
              Système nutritionnel intelligent basé sur les recommandations professionnelles.
            </p>
            <div style={{ fontSize: '12px', color: '#059669' }}>
              <div>✅ Respecte les rythmes biologiques</div>
              <div>✅ Favorise la digestion optimale</div>
              <div>✅ Maintient l'équilibre nutritionnel</div>
            </div>
          </div>

          <div style={{
            background: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h4 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>🚀 Évolution :</h4>
            <p style={{ color: '#1d4ed8', fontSize: '14px', marginBottom: '12px' }}>
              Les règles peuvent être personnalisées selon vos besoins.
            </p>
            <div style={{ fontSize: '12px', color: '#2563eb' }}>
              <div>🩺 Mode Diététicienne : règles pro</div>
              <div>⚙️ Mode Personnalisé : à venir</div>
              <div>🆓 Mode Libre : sans contraintes</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}