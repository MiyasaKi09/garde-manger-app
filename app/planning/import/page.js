'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Upload, FileSpreadsheet, FileJson, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function ImportPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  // Auth est gérée par middleware.js (redirection /login si pas de session)

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.json'))) {
      setFile(f)
      setError(null)
    } else {
      setError('Format invalide. Fichiers .xlsx ou .json acceptés.')
    }
  }

  function handleFileSelect(e) {
    const f = e.target.files[0]
    if (f) {
      setFile(f)
      setError(null)
    }
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const formData = new FormData()
      formData.append('file', file)

      const fetchOptions = { method: 'POST', body: formData }
      if (session?.access_token) {
        fetchOptions.headers = { 'Authorization': `Bearer ${session.access_token}` }
      } else {
        // Pas de session localStorage, essayer via cookies
        fetchOptions.credentials = 'include'
      }

      const res = await fetch('/api/planning/import', fetchOptions)

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'import')
        return
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="v21-page narrow">
        <button onClick={() => router.push('/planning')} className="imp-back">
          <ArrowLeft size={15} /> Retour au planning
        </button>

        {/* ═══ HERO ÉDITORIAL ═══ */}
        <header className="v21-hero">
          <div className="v21-hero-text">
            <span className="v21-eyebrow">Import · plan nutritionnel</span>
            <h1 className="v21-title">Importer un plan.</h1>
            <div className="v21-rule" />
            <p className="v21-lede">Déposez le fichier .xlsx ou .json généré par votre nutritionniste.</p>
          </div>
        </header>

        {!result ? (
          <section className="v21-section flush imp-body">
            <div
              className={`imp-drop ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {file ? (
                <div className="imp-file">
                  {file.name.endsWith('.json') ? (
                    <FileJson size={36} color="var(--terracotta)" strokeWidth={1.4} />
                  ) : (
                    <FileSpreadsheet size={36} color="var(--terracotta)" strokeWidth={1.4} />
                  )}
                  <div className="imp-file-name">{file.name}</div>
                  <div className="imp-file-size">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div className="imp-prompt">
                  <Upload size={36} color="var(--ink-3)" strokeWidth={1.4} />
                  <div className="imp-drop-t">Glissez votre fichier .xlsx ou .json ici</div>
                  <div className="imp-drop-h">ou cliquez pour parcourir</div>
                </div>
              )}
            </div>

            {error && (
              <div className="imp-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {file && (
              uploading ? (
                <div className="imp-uploading" aria-busy="true">
                  <div className="v21-skel" style={{ height: 12, width: '70%' }} />
                  <span className="imp-uploading-l">Import en cours…</span>
                </div>
              ) : (
                <button className="v21-btn" onClick={handleUpload}>
                  <Upload size={15} /> Importer le plan
                </button>
              )
            )}
          </section>
        ) : (
          <section className="v21-section flush imp-body">
            <span className="imp-ok-eyebrow"><CheckCircle size={14} /> Import réussi</span>
            {result.meta?.monthLabel && <p className="imp-month">{result.meta.monthLabel}</p>}

            <div className="v21-stats cols-4 imp-summary">
              <div className="v21-stat">
                <span className="v21-stat-l">Repas</span>
                <span className="v21-stat-v">{result.summary.meals}</span>
              </div>
              <div className="v21-stat">
                <span className="v21-stat-l">Recettes batch</span>
                <span className="v21-stat-v">{result.summary.batchRecipes}</span>
              </div>
              <div className="v21-stat">
                <span className="v21-stat-l">Tâches prep</span>
                <span className="v21-stat-v">{result.summary.prepTasks}</span>
              </div>
              <div className="v21-stat">
                <span className="v21-stat-l">Articles courses</span>
                <span className="v21-stat-v">{result.summary.shoppingItems}</span>
              </div>
            </div>

            {result.warnings?.length > 0 && (
              <div className="imp-warn">
                <AlertCircle size={15} />
                <span>{result.warnings.length} avertissement(s)</span>
              </div>
            )}

            <button className="v21-btn" onClick={() => router.push(`/planning/${result.importId}`)}>
              Voir le planning
            </button>
          </section>
        )}
      </div>

      <style jsx>{`
        .imp-back {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.03em; text-transform: uppercase;
          background: none; border: none; color: var(--ink-3); cursor: pointer;
          padding: 0; margin-bottom: 20px; transition: color 0.15s ease;
        }
        .imp-back:hover { color: var(--terracotta); }

        .imp-body { display: flex; flex-direction: column; align-items: flex-start; gap: 18px; padding-top: 30px; }

        .imp-drop {
          width: 100%; box-sizing: border-box;
          border: 1.5px dashed var(--line-strong); border-radius: 3px;
          padding: 48px 24px; text-align: center; cursor: pointer;
          background: var(--surface);
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .imp-drop:hover, .imp-drop.dragging { border-color: var(--terracotta); background: var(--surface-soft); }
        .imp-drop.has-file { border-style: solid; border-color: var(--terracotta); background: var(--surface-soft); }

        .imp-prompt, .imp-file { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .imp-drop-t { font-family: var(--font-display); font-size: 17px; font-weight: 600; color: var(--ink-1); }
        .imp-drop-h { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.04em; }
        .imp-file-name { font-family: var(--font-display); font-size: 17px; font-weight: 600; color: var(--ink-1); }
        .imp-file-size { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); }

        .imp-error {
          display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box;
          font-family: var(--font-text); font-size: 13px;
          color: var(--state-expired); background: var(--state-expired-bg);
          border: 1px solid var(--state-expired); border-radius: 3px; padding: 11px 14px;
        }

        .imp-uploading { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 320px; }
        .imp-uploading-l { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-3); }

        .imp-ok-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          background: var(--brand); color: #fff; padding: 5px 10px; border-radius: 3px;
        }
        .imp-month { font-family: var(--font-text); font-size: 14px; color: var(--ink-2); margin: 0; }
        .imp-summary { width: 100%; }
        .imp-summary .v21-stat { padding: 18px 18px 18px 0; }

        .imp-warn {
          display: flex; align-items: center; gap: 7px;
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.03em; text-transform: uppercase;
          color: var(--state-soon);
        }
      `}</style>
    </>
  )
}
