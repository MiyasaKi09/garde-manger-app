'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Clock, ChefHat, Flame, Users } from 'lucide-react'

export default function BatchPage() {
  const router = useRouter()
  const { importId } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const res = await authFetch(`/api/planning/imports/${importId}`)
      if (!res.ok) { router.push('/planning'); return }
      setData(await res.json())
      setLoading(false)
    }
    load()
  }, [importId])

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Chargement...</p></div>
  if (!data) return null

  const prepTasks = data.prepTasks || []
  const batchRecipes = data.batchRecipes || []

  return (
    <>
      <div className="container">
        <div className="header-card">
          <button className="back-btn" onClick={() => router.push(`/planning/${importId}`)}>
            <ArrowLeft size={18} /> Retour au calendrier
          </button>
          <h1>Batch cooking & Prep</h1>
          <p>{data.import?.month_label}</p>
        </div>

        {/* Prep Schedule */}
        <div className="section">
          <h2><Clock size={20} /> Planning des preparations</h2>
          <div className="prep-list">
            {prepTasks.map((task, i) => {
              const isFree = /libre|🎉|0\s*min/i.test(task.task) || /🎉/.test(task.estimated_time)
              return (
                <div key={i} className={`prep-item ${isFree ? 'free' : ''}`}>
                  <div className="prep-date">{task.prep_label || (task.prep_date ? new Date(task.prep_date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '—')}</div>
                  <div className="prep-task">{task.task}</div>
                  <div className="prep-time">{task.estimated_time || ''}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Batch Recipes */}
        <div className="section">
          <h2><ChefHat size={20} /> Recettes batch</h2>
          <div className="recipes-grid">
            {batchRecipes.map((recipe, i) => (
              <div key={i} className="recipe-card">
                <div className="recipe-header">
                  <h3>{recipe.name}</h3>
                  {recipe.timing && <span className="timing-badge"><Clock size={14} /> {recipe.timing}</span>}
                </div>

                {recipe.ingredients && (
                  <div className="recipe-section">
                    <div className="section-label">Ingredients</div>
                    <div className="ingredients-text">{recipe.ingredients}</div>
                  </div>
                )}

                {recipe.rendement && (
                  <div className="recipe-meta">
                    <Flame size={14} /> Rendement: {recipe.rendement}
                  </div>
                )}

                {recipe.macros_per_100g && (
                  <div className="recipe-meta">
                    Macros/100g: {recipe.macros_per_100g}
                  </div>
                )}

                {recipe.portions && (
                  <div className="recipe-section">
                    <div className="section-label"><Users size={14} /> Portions</div>
                    <div className="portions-text">{recipe.portions}</div>
                  </div>
                )}

                {recipe.reheat && (
                  <div className="recipe-meta reheat">
                    {recipe.reheat}
                  </div>
                )}

                {recipe.instructions && (
                  <div className="recipe-section">
                    <div className="section-label">Preparation</div>
                    <div className="instructions-text">{recipe.instructions}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .container { padding: 16px; max-width: 900px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .header-card { background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 20px; margin-bottom: 20px; }
        .back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #6b7280; cursor: pointer; font-size: 14px; padding: 4px 8px; border-radius: 6px; margin-bottom: 8px; }
        .back-btn:hover { background: rgba(0,0,0,0.05); }
        .header-card h1 { font-size: 22px; font-weight: bold; color: #1f2937; margin: 0 0 4px; }
        .header-card p { color: #6b7280; margin: 0; font-size: 14px; }

        .section { margin-bottom: 28px; }
        .section h2 { display: flex; align-items: center; gap: 8px; font-size: 18px; color: #1f2937; margin: 0 0 14px; }

        .prep-list { display: flex; flex-direction: column; gap: 6px; }
        .prep-item { display: grid; grid-template-columns: 120px 1fr 80px; gap: 12px; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; font-size: 13px; }
        .prep-item.free { background: rgba(34,197,94,0.05); border-color: rgba(34,197,94,0.2); }
        .prep-date { font-weight: 600; color: #374151; font-size: 12px; }
        .prep-task { color: #374151; line-height: 1.3; }
        .prep-time { text-align: right; font-weight: 600; color: #6b7280; font-size: 12px; }

        .recipes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 14px; }
        .recipe-card { background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 14px; padding: 18px; }
        .recipe-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px; }
        .recipe-header h3 { font-size: 16px; font-weight: 700; color: #1f2937; margin: 0; }
        .timing-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; background: rgba(59,130,246,0.08); color: #2563eb; border-radius: 6px; font-size: 12px; font-weight: 500; white-space: nowrap; }

        .recipe-section { margin-bottom: 10px; }
        .section-label { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .ingredients-text, .portions-text, .instructions-text { font-size: 13px; color: #374151; line-height: 1.5; white-space: pre-line; }
        .recipe-meta { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 4px; margin-bottom: 6px; }
        .recipe-meta.reheat { background: rgba(234,179,8,0.08); padding: 4px 8px; border-radius: 6px; color: #92400e; }

        @media (max-width: 768px) {
          .prep-item { grid-template-columns: 1fr; gap: 4px; }
          .prep-time { text-align: left; }
          .recipes-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
