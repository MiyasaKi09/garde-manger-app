'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, Trash2, Calendar, ChevronRight, Sparkles, Leaf } from 'lucide-react'
import WeeklyPlanView from './components/WeeklyPlanView'
import DailyNutritionRecap from './components/DailyNutritionRecap'

export default function PlanningPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imports, setImports] = useState([])

  useEffect(() => { checkAuth() }, [])
  useEffect(() => { if (user) loadImports() }, [user])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
    } catch (error) {
      console.error('Erreur auth:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadImports() {
    try {
      const res = await authFetch('/api/planning/imports')
      const data = await res.json()
      if (data.imports) setImports(data.imports)
    } catch (err) {
      console.error('Erreur chargement imports:', err)
    }
  }

  async function handleDelete(importId, e) {
    e.stopPropagation()
    if (!confirm('Supprimer ce plan importé ?')) return
    try {
      await authFetch(`/api/planning/imports/${importId}`, { method: 'DELETE' })
      setImports(prev => prev.filter(i => i.id !== importId))
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: 40, height: 40, border: '3px solid #e5e7eb',
            borderTop: '3px solid #4a7c4a', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>Chargement...</p>
        </div>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const latestImport = imports[0] || null

  return (
    <>
      <div className="planning-container">
        {/* ═══ HERO HEADER ═══ */}
        <div className="hero-header">
          <div className="hero-decoration">
            <Leaf size={120} strokeWidth={0.5} />
          </div>
          <div className="hero-content">
            <div className="hero-text">
              <span className="hero-eyebrow">Planning</span>
              <h1 className="hero-title">Vos repas de la semaine</h1>
              <p className="hero-subtitle">Planifiez, cuisinez, savourez — avec l'aide de Myko</p>
            </div>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => router.push('/planning/assistant')}>
                <Sparkles size={18} />
                Demander à Myko
              </button>
              <button className="btn-secondary" onClick={() => router.push('/planning/import')}>
                <Upload size={18} />
                Importer .xlsx
              </button>
            </div>
          </div>
        </div>

        {/* ═══ WEEKLY VIEW ═══ */}
        {latestImport && (
          <section className="planning-section">
            <div className="section-header">
              <div className="section-accent"></div>
              <h2 className="section-title">Semaine en cours</h2>
            </div>
            <WeeklyPlanView importId={latestImport.id} />
          </section>
        )}

        {/* ═══ DAILY NUTRITION RECAP ═══ */}
        {latestImport && (
          <section className="planning-section">
            <div className="section-header">
              <div className="section-accent"></div>
              <h2 className="section-title">Suivi nutritionnel</h2>
            </div>
            <DailyNutritionRecap importId={latestImport.id} />
          </section>
        )}

        {/* ═══ EMPTY STATE ═══ */}
        {imports.length === 0 && (
          <section className="planning-section">
            <div className="empty-state-card">
              <div className="empty-icon">
                <FileSpreadsheet size={48} strokeWidth={1.2} />
              </div>
              <h3>Aucun plan encore</h3>
              <p>Demande à Myko de créer un planning ou importe un fichier .xlsx</p>
              <button className="btn-primary btn-lg" onClick={() => router.push('/planning/assistant')}>
                <Sparkles size={20} />
                Créer un planning avec l'IA
              </button>
            </div>
          </section>
        )}

        {/* ═══ MANAGE IMPORTS (compact) ═══ */}
        {imports.length > 0 && (
          <section className="planning-section">
            <details className="imports-details">
              <summary className="imports-summary">
                <Calendar size={14} />
                {imports.length} plan{imports.length > 1 ? 's' : ''} importé{imports.length > 1 ? 's' : ''}
              </summary>
              <div className="imports-compact">
                {imports.map(imp => (
                  <div key={imp.id} className="import-row">
                    <span className="import-row-name" onClick={() => router.push(`/planning/${imp.id}`)}>
                      {imp.month_label || imp.file_name}
                    </span>
                    <span className="import-row-date">
                      {new Date(imp.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <button className="delete-btn" onClick={(e) => handleDelete(imp.id, e)} title="Supprimer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </details>
          </section>
        )}
      </div>

      <style jsx>{`
        .planning-container {
          padding: 12px 16px 40px;
          max-width: 860px;
          margin: 0 auto;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* ═══ HERO ═══ */
        .hero-header {
          position: relative;
          background: linear-gradient(135deg, #2d5a2d 0%, #4a7c4a 50%, #6b9d6b 100%);
          border-radius: 24px;
          padding: 36px 32px;
          margin-bottom: 32px;
          overflow: hidden;
          box-shadow:
            0 8px 32px rgba(45, 90, 45, 0.25),
            0 2px 8px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .hero-decoration {
          position: absolute;
          top: -20px;
          right: -10px;
          opacity: 0.08;
          color: white;
          transform: rotate(15deg);
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .hero-eyebrow {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 4px;
        }

        .hero-title {
          font-family: 'Crimson Text', Georgia, serif;
          font-size: 32px;
          font-weight: 700;
          color: white;
          margin: 0 0 6px;
          letter-spacing: -0.02em;
          line-height: 1.15;
          background: none;
          -webkit-text-fill-color: white;
        }

        .hero-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
          font-weight: 400;
        }

        .hero-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          background: rgba(255, 255, 255, 0.95);
          color: #2d5a2d;
          border: none;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          background: white;
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Inter', sans-serif;
          backdrop-filter: blur(4px);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .btn-lg {
          padding: 14px 28px;
          font-size: 15px;
          border-radius: 16px;
        }

        /* ═══ SECTIONS ═══ */
        .planning-section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .section-accent {
          width: 4px;
          height: 22px;
          background: linear-gradient(180deg, #4a7c4a, #8bb58b);
          border-radius: 4px;
          flex-shrink: 0;
        }

        .section-title {
          font-family: 'Crimson Text', Georgia, serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--forest-800, #2d5a2d);
          margin: 0;
          letter-spacing: -0.01em;
        }

        /* ═══ EMPTY STATE ═══ */
        .empty-state-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 2px dashed rgba(74, 124, 74, 0.2);
          border-radius: 20px;
          padding: 56px 24px;
          text-align: center;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, rgba(74, 124, 74, 0.08), rgba(139, 181, 139, 0.12));
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8bb58b;
        }

        .empty-state-card h3 {
          font-family: 'Crimson Text', Georgia, serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--forest-800, #2d5a2d);
          margin: 0 0 8px;
        }

        .empty-state-card p {
          color: #6b7280;
          font-size: 14px;
          margin: 0 0 24px;
          max-width: 340px;
          margin-left: auto;
          margin-right: auto;
        }

        .empty-state-card .btn-primary {
          display: inline-flex;
          background: linear-gradient(135deg, #2d5a2d, #4a7c4a);
          color: white;
        }

        .empty-state-card .btn-primary:hover {
          background: linear-gradient(135deg, #1f4a1f, #3a6c3a);
        }

        /* ═══ IMPORTS GRID ═══ */
        .imports-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .import-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(74, 124, 74, 0.1);
          border-radius: 16px;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeSlideUp 0.4s ease-out backwards;
        }

        .import-card:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(74, 124, 74, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(45, 90, 45, 0.1);
        }

        .import-icon-wrap {
          flex-shrink: 0;
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, rgba(74, 124, 74, 0.1), rgba(139, 181, 139, 0.15));
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4a7c4a;
          transition: all 0.25s;
        }

        .import-card:hover .import-icon-wrap {
          background: linear-gradient(135deg, #4a7c4a, #6b9d6b);
          color: white;
          transform: scale(1.05);
        }

        .import-info {
          flex: 1;
          min-width: 0;
        }

        .import-month {
          font-family: 'Crimson Text', Georgia, serif;
          font-size: 19px;
          font-weight: 600;
          color: var(--forest-800, #2d5a2d);
          line-height: 1.2;
        }

        .import-dates {
          font-size: 13px;
          color: #4a7c4a;
          font-weight: 500;
          margin-top: 3px;
        }

        .import-meta {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }

        .import-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .delete-btn {
          background: none;
          border: none;
          color: #d1d5db;
          cursor: pointer;
          padding: 8px;
          border-radius: 10px;
          transition: all 0.2s;
          display: flex;
        }

        .delete-btn:hover {
          color: #dc2626;
          background: rgba(220, 38, 38, 0.08);
        }

        /* ═══ ANIMATIONS ═══ */
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ═══ COMPACT IMPORTS ═══ */
        .imports-details {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 14px;
          overflow: hidden;
        }

        .imports-summary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          list-style: none;
          transition: background 0.2s;
        }

        .imports-summary::-webkit-details-marker { display: none; }

        .imports-summary:hover {
          background: rgba(74, 124, 74, 0.04);
          color: #4a7c4a;
        }

        .imports-compact {
          padding: 4px 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .import-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          transition: background 0.15s;
        }

        .import-row:hover {
          background: rgba(74, 124, 74, 0.04);
        }

        .import-row-name {
          flex: 1;
          min-width: 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--forest-800, #2d5a2d);
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: 'Crimson Text', Georgia, serif;
        }

        .import-row-name:hover {
          text-decoration: underline;
        }

        .import-row-date {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
          flex-shrink: 0;
          font-family: 'Inter', sans-serif;
        }

        /* ═══ RESPONSIVE ═══ */
        @media (max-width: 768px) {
          .planning-container { padding: 8px 12px 32px; }
          .hero-header { padding: 24px 16px; border-radius: 18px; }
          .hero-content { flex-direction: column; text-align: center; }
          .hero-actions { justify-content: center; flex-wrap: wrap; }
          .hero-title { font-size: 24px; }
          .hero-subtitle { font-size: 13px; }
          .section-title { font-size: 18px; }
          .import-card { flex-wrap: wrap; }
          .imports-summary { font-size: 12px; padding: 10px 14px; }
          .imports-compact { padding: 4px 12px 10px; }
        }

        @media (max-width: 480px) {
          .planning-container { padding: 6px 8px 24px; }
          .hero-header { padding: 20px 14px; border-radius: 16px; }
          .hero-title { font-size: 22px; }
          .hero-subtitle { font-size: 12px; }
          .hero-actions { gap: 8px; }
          .section-title { font-size: 16px; }
          .planning-section { margin-bottom: 16px; }
          .section-header { margin-bottom: 10px; }
        }
      `}</style>
    </>
  )
}
