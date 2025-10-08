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

  const mealTypes = [
    { id: 'petit-dejeuner', name: 'P-déj', icon: '🌅' },
    { id: 'dejeuner', name: 'Déj', icon: '☀️' },
    { id: 'diner', name: 'Dîner', icon: '🌙' }
  ]

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
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    setWeekDates(dates)
  }

  async function loadPlanning() {
    // Simuler des données
    const mockPlanning = {}
    weekDates.forEach(date => {
      const dateKey = date.toISOString().split('T')[0]
      mockPlanning[dateKey] = {
        'petit-dejeuner': Math.random() > 0.7 ? { recipe: 'Porridge' } : null,
        'dejeuner': Math.random() > 0.4 ? { recipe: 'Salade César' } : null,
        'diner': Math.random() > 0.3 ? { recipe: 'Pâtes bolognaise' } : null
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

  function isToday(date) {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Formes organiques en arrière-plan */}
      <div className="organic-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
      </div>

      <div className="planning-container">
        {/* En-tête */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-title">
              <h1>🗓️ Planning de la semaine</h1>
              <p>Organisez vos repas selon vos préférences</p>
            </div>
            <div className="week-navigation">
              <button onClick={() => navigateWeek(-1)} className="nav-button">
                ← Précédente
              </button>
              <div className="week-info">
                <strong>
                  {weekDates[0]?.getDate()} - {weekDates[6]?.getDate()}/
                  {weekDates[6]?.getMonth() + 1}/{weekDates[6]?.getFullYear()}
                </strong>
              </div>
              <button onClick={() => navigateWeek(1)} className="nav-button">
                Suivante →
              </button>
            </div>
          </div>
        </div>

        {/* Grille planning */}
        <div className="planning-grid">
          
          {/* En-têtes jours */}
          <div className="grid-header">
            <div className="meal-label-header">Repas</div>
            {weekDates.map((date, index) => (
              <div 
                key={index} 
                className={`day-header ${isToday(date) ? 'today' : ''}`}
                onClick={() => setSelectedDay(selectedDay === date.getTime() ? null : date.getTime())}
              >
                <div className="day-name">
                  {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="day-number">{date.getDate()}</div>
                {isToday(date) && <div className="today-label">Aujourd'hui</div>}
              </div>
            ))}
          </div>

          {/* Lignes des repas */}
          {mealTypes.map(meal => (
            <div key={meal.id} className="meal-row">
              <div className="meal-label">
                <div className="meal-icon">{meal.icon}</div>
                <div className="meal-name">{meal.name}</div>
              </div>

              {weekDates.map(date => {
                const dayPlan = getDayPlanning(date)
                const mealPlan = dayPlan[meal.id]
                const isSelected = selectedDay === date.getTime()
                
                return (
                  <div 
                    key={`${meal.id}-${date.getTime()}`}
                    className={`meal-cell ${mealPlan ? 'filled' : 'empty'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDay(selectedDay === date.getTime() ? null : date.getTime())}
                  >
                    {mealPlan ? (
                      <div className="meal-content">
                        <div className="recipe-name">{mealPlan.recipe}</div>
                        <div className="status-dot"></div>
                      </div>
                    ) : (
                      <div className="empty-meal">+ Ajouter</div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Détails jour sélectionné */}
        {selectedDay && (
          <div className="day-details">
            <div className="details-header">
              <h3>
                📅 {new Date(selectedDay).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="close-button">
                ✕
              </button>
            </div>

            <div className="meals-detail-grid">
              {mealTypes.map(meal => {
                const dayPlan = getDayPlanning(new Date(selectedDay))
                const mealPlan = dayPlan[meal.id]
                
                return (
                  <div key={meal.id} className={`meal-detail-card ${mealPlan ? 'has-recipe' : 'no-recipe'}`}>
                    <div className="meal-detail-header">
                      <span className="meal-detail-icon">{meal.icon}</span>
                      <span className="meal-detail-name">{meal.name}</span>
                    </div>
                    
                    {mealPlan ? (
                      <div className="recipe-details">
                        <div className="recipe-title">{mealPlan.recipe}</div>
                        <div className="recipe-actions">
                          <button className="action-button modify">Modifier</button>
                          <button className="action-button remove">Retirer</button>
                        </div>
                      </div>
                    ) : (
                      <button className="add-recipe-button">
                        + Choisir une recette
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="stats-grid">
          <div className="stats-card">
            <h4>📊 Cette semaine</h4>
            <div className="stat-item">
              <span>Repas planifiés :</span>
              <span className="stat-value">
                {Object.values(planning).reduce((total, day) => 
                  total + Object.values(day).filter(meal => meal?.recipe).length, 0
                )} / 21
              </span>
            </div>
          </div>

          <div className="stats-card">
            <h4>🎯 Actions</h4>
            <button className="action-button-full">Planifier automatiquement</button>
            <button className="action-button-full">Générer liste courses</button>
          </div>

          <div className="stats-card">
            <h4>🌿 Score Myko</h4>
            <div className="score">85/100</div>
            <div className="score-details">Excellent équilibre</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .planning-container {
          min-height: 100vh;
          background: linear-gradient(135deg, 
            #f7fef4 0%, 
            #f0f9ff 25%, 
            #fef3e2 50%, 
            #f4f1f0 75%, 
            #f0fdf4 100%
          );
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
        }

        /* Formes organiques Myko */
        .organic-shapes {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .shape {
          position: absolute;
          border-radius: 50% 70% 60% 40%;
          opacity: 0.6;
          filter: blur(1px);
          animation: float 20s infinite ease-in-out;
        }

        .shape-1 {
          width: 300px;
          height: 400px;
          background: linear-gradient(135deg, rgba(45, 80, 22, 0.15), rgba(139, 149, 109, 0.1));
          top: -100px;
          right: -50px;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 250px;
          height: 350px;
          background: linear-gradient(45deg, rgba(194, 154, 89, 0.12), rgba(239, 205, 132, 0.08));
          bottom: -80px;
          left: -60px;
          animation-delay: -5s;
        }

        .shape-3 {
          width: 200px;
          height: 280px;
          background: linear-gradient(225deg, rgba(166, 115, 92, 0.1), rgba(201, 146, 127, 0.08));
          top: 30%;
          left: -40px;
          animation-delay: -10s;
        }

        .shape-4 {
          width: 180px;
          height: 240px;
          background: linear-gradient(315deg, rgba(139, 149, 109, 0.12), rgba(45, 80, 22, 0.08));
          top: 20%;
          right: -30px;
          animation-delay: -15s;
        }

        .shape-5 {
          width: 220px;
          height: 320px;
          background: linear-gradient(180deg, rgba(194, 154, 89, 0.1), rgba(239, 205, 132, 0.06));
          bottom: 20%;
          right: 10%;
          animation-delay: -7s;
        }

        @keyframes float {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg) scale(1); 
            border-radius: 50% 70% 60% 40%;
          }
          25% { 
            transform: translate(30px, -20px) rotate(5deg) scale(1.05); 
            border-radius: 60% 50% 70% 50%;
          }
          50% { 
            transform: translate(-20px, -40px) rotate(-3deg) scale(0.95); 
            border-radius: 70% 60% 50% 60%;
          }
          75% { 
            transform: translate(25px, -10px) rotate(7deg) scale(1.02); 
            border-radius: 40% 70% 60% 50%;
          }
        }

        .header-card {
          background: rgba(255, 254, 249, 0.25);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 32px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          z-index: 10;
          box-shadow: 
            0 8px 32px rgba(45, 80, 22, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .header-title h1 {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .header-title p {
          color: #6b7280;
          margin: 0;
        }

        .week-navigation {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-button {
          background: rgba(255, 254, 249, 0.3);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 12px;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: rgba(45, 80, 22, 0.8);
          font-weight: 500;
          box-shadow: 0 2px 12px rgba(45, 80, 22, 0.05);
        }

        .nav-button:hover {
          background: rgba(255, 254, 249, 0.5);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(45, 80, 22, 0.1);
        }

        .week-info {
          text-align: center;
          color: #374151;
          font-size: 16px;
        }

        .planning-grid {
          background: rgba(255, 254, 249, 0.2);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 32px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          overflow-x: auto;
          position: relative;
          z-index: 10;
          box-shadow: 
            0 8px 32px rgba(45, 80, 22, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .grid-header {
          display: grid;
          grid-template-columns: 120px repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .meal-label-header {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          font-weight: 600;
          color: #374151;
        }

        .day-header {
          background: rgba(255, 254, 249, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 16px;
          padding: 12px 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(45, 80, 22, 0.05);
        }

        .day-header:hover {
          background: rgba(255, 254, 249, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(45, 80, 22, 0.1);
        }

        .day-header.today {
          background: rgba(139, 149, 109, 0.2);
          border: 2px solid rgba(45, 80, 22, 0.4);
          box-shadow: 0 4px 20px rgba(45, 80, 22, 0.15);
        }

        .day-name {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .day-number {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
        }

        .today-label {
          font-size: 10px;
          color: #16a34a;
          font-weight: 600;
        }

        .meal-row {
          display: grid;
          grid-template-columns: 120px repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 8px;
        }

        .meal-label {
          background: rgba(255, 254, 249, 0.3);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px 12px;
          min-height: 90px;
          box-shadow: 0 4px 16px rgba(45, 80, 22, 0.05);
        }

        .meal-icon {
          font-size: 20px;
          margin-bottom: 4px;
        }

        .meal-name {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-align: center;
        }

        .meal-cell {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          padding: 8px;
        }

        .meal-cell.filled {
          border-color: rgba(45, 80, 22, 0.4);
          background: rgba(139, 149, 109, 0.15);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 2px 12px rgba(45, 80, 22, 0.1);
        }

        .meal-cell.empty:hover {
          border-color: rgba(45, 80, 22, 0.3);
          background: rgba(139, 149, 109, 0.08);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .meal-cell.selected {
          box-shadow: 0 0 0 2px #3b82f6;
        }

        .meal-content {
          text-align: center;
          width: 100%;
        }

        .recipe-name {
          font-size: 11px;
          font-weight: 600;
          color: rgba(45, 80, 22, 0.9);
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: rgba(139, 149, 109, 0.8);
          border-radius: 50%;
          margin: 0 auto;
        }

        .empty-meal {
          color: #9ca3af;
          font-size: 12px;
          font-weight: 500;
        }

        .day-details {
          background: rgba(255, 254, 249, 0.25);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 32px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          z-index: 10;
          box-shadow: 
            0 8px 32px rgba(45, 80, 22, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .details-header h3 {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          color: #6b7280;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
        }

        .close-button:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #374151;
        }

        .meals-detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .meal-detail-card {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .meal-detail-card.has-recipe {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.05);
        }

        .meal-detail-header {
          margin-bottom: 16px;
        }

        .meal-detail-icon {
          font-size: 24px;
          margin-right: 8px;
        }

        .meal-detail-name {
          font-weight: 600;
          color: #374151;
        }

        .recipe-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recipe-title {
          font-weight: 600;
          color: #16a34a;
          font-size: 16px;
        }

        .recipe-actions {
          display: flex;
          gap: 8px;
        }

        .action-button {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .action-button.modify {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .action-button.modify:hover {
          background: #bfdbfe;
        }

        .action-button.remove {
          background: #fee2e2;
          color: #dc2626;
        }

        .action-button.remove:hover {
          background: #fecaca;
        }

        .add-recipe-button {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          color: #374151;
        }

        .add-recipe-button:hover {
          background: rgba(255, 255, 255, 0.8);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .stats-card {
          background: rgba(255, 254, 249, 0.25);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          z-index: 10;
          box-shadow: 
            0 8px 32px rgba(45, 80, 22, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .stats-card h4 {
          margin: 0 0 16px 0;
          font-weight: 600;
          color: #374151;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #6b7280;
        }

        .stat-value {
          font-weight: 600;
          color: #16a34a;
        }

        .action-button-full {
          width: 100%;
          padding: 8px 12px;
          margin-bottom: 8px;
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          color: #0ea5e9;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .action-button-full:hover {
          background: #e0f7fa;
        }

        .score {
          font-size: 32px;
          font-weight: bold;
          color: #16a34a;
          text-align: center;
          margin-bottom: 8px;
        }

        .score-details {
          text-align: center;
          font-size: 12px;
          color: #16a34a;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #22c55e;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .planning-container {
            padding: 10px;
          }

          .grid-header, .meal-row {
            grid-template-columns: 80px repeat(7, minmax(60px, 1fr));
          }

          .meal-label {
            padding: 8px 4px;
            min-height: 60px;
          }

          .meal-cell {
            min-height: 60px;
            padding: 4px;
          }

          .recipe-name {
            font-size: 10px;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .meals-detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}