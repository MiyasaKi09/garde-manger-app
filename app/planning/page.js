'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, Trash2, Calendar, ChevronRight } from 'lucide-react'

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
      const res = await fetch('/api/planning/imports')
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
      await fetch(`/api/planning/imports/${importId}`, { method: 'DELETE' })
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
            borderTop: '3px solid #22c55e', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 16px'
          }}></div>
          <p>Chargement...</p>
        </div>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      <div className="planning-container">
        <div className="header-card">
          <div className="header-content">
            <div className="header-title">
              <h1>Planning nutritionnel</h1>
              <p>Importez et consultez vos plans repas</p>
            </div>
            <button className="import-button" onClick={() => router.push('/planning/import')}>
              <Upload size={18} />
              Importer un plan .xlsx
            </button>
          </div>
        </div>

        {imports.length === 0 ? (
          <div className="empty-state">
            <FileSpreadsheet size={64} color="#d1d5db" />
            <h3>Aucun plan importe</h3>
            <p>Importez votre premier fichier .xlsx pour commencer</p>
            <button className="import-button-lg" onClick={() => router.push('/planning/import')}>
              <Upload size={20} />
              Importer un plan
            </button>
          </div>
        ) : (
          <div className="imports-grid">
            {imports.map(imp => (
              <div
                key={imp.id}
                className="import-card"
                onClick={() => router.push(`/planning/${imp.id}`)}
              >
                <div className="import-icon">
                  <Calendar size={28} color="#16a34a" />
                </div>
                <div className="import-info">
                  <div className="import-month">{imp.month_label || imp.file_name}</div>
                  <div className="import-dates">
                    {imp.date_range_start && imp.date_range_end
                      ? `${new Date(imp.date_range_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${new Date(imp.date_range_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : imp.file_name
                    }
                  </div>
                  <div className="import-date">
                    Importe le {new Date(imp.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="import-actions">
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(imp.id, e)}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={20} color="#9ca3af" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .planning-container {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .header-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-title h1 {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin: 0 0 4px;
        }

        .header-title p {
          color: #6b7280;
          margin: 0;
          font-size: 14px;
        }

        .import-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .import-button:hover { background: #15803d; }

        .empty-state {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 60px 24px;
          text-align: center;
        }

        .empty-state h3 {
          font-size: 20px;
          color: #374151;
          margin: 16px 0 8px;
        }

        .empty-state p {
          color: #9ca3af;
          margin: 0 0 24px;
        }

        .import-button-lg {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .import-button-lg:hover { background: #15803d; }

        .imports-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .import-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .import-card:hover {
          background: rgba(255, 255, 255, 0.4);
          border-color: #16a34a;
        }

        .import-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .import-info {
          flex: 1;
          min-width: 0;
        }

        .import-month {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .import-dates {
          font-size: 14px;
          color: #16a34a;
          margin-top: 2px;
        }

        .import-date {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }

        .import-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .delete-btn {
          background: none;
          border: none;
          color: #d1d5db;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .delete-btn:hover {
          color: #dc2626;
          background: rgba(220, 38, 38, 0.1);
        }

        @media (max-width: 768px) {
          .header-content { flex-direction: column; text-align: center; }
          .import-card { flex-wrap: wrap; }
        }
      `}</style>
    </>
  )
}
