'use client'

import { useState, useRef, useEffect } from 'react'
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
  // Auth is handled by ProtectedShell, no need to double-check here

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
      <div className="import-container">
        <div className="header-card">
          <button onClick={() => router.push('/planning')} className="back-button">
            <ArrowLeft size={18} /> Retour au planning
          </button>
          <h1>Importer un plan nutritionnel</h1>
          <p>Déposez le fichier .xlsx ou .json généré par votre nutritionniste</p>
        </div>

        {!result ? (
          <>
            <div
              className={`drop-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
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
                <div className="file-info">
                  {file.name.endsWith('.json') ? (
                    <FileJson size={48} color="#16a34a" />
                  ) : (
                    <FileSpreadsheet size={48} color="#16a34a" />
                  )}
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div className="drop-prompt">
                  <Upload size={48} color="#9ca3af" />
                  <div className="drop-text">Glissez votre fichier .xlsx ou .json ici</div>
                  <div className="drop-hint">ou cliquez pour parcourir</div>
                </div>
              )}
            </div>

            {error && (
              <div className="error-banner">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {file && (
              <button
                className="upload-button"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="spinner-sm"></div>
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Importer le plan
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <div className="success-card">
            <CheckCircle size={48} color="#16a34a" />
            <h2>Import réussi !</h2>
            <p className="month-label">{result.meta?.monthLabel}</p>

            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-number">{result.summary.meals}</div>
                <div className="summary-label">Repas</div>
              </div>
              <div className="summary-item">
                <div className="summary-number">{result.summary.batchRecipes}</div>
                <div className="summary-label">Recettes batch</div>
              </div>
              <div className="summary-item">
                <div className="summary-number">{result.summary.prepTasks}</div>
                <div className="summary-label">Tâches prep</div>
              </div>
              <div className="summary-item">
                <div className="summary-number">{result.summary.shoppingItems}</div>
                <div className="summary-label">Articles courses</div>
              </div>
            </div>

            {result.warnings?.length > 0 && (
              <div className="warnings">
                <AlertCircle size={16} />
                <span>{result.warnings.length} avertissement(s)</span>
              </div>
            )}

            <button
              className="view-button"
              onClick={() => router.push(`/planning/${result.importId}`)}
            >
              Voir le planning
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .import-container {
          padding: 20px;
          max-width: 600px;
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
          text-align: center;
        }

        .header-card h1 {
          font-size: 24px;
          color: #1f2937;
          margin: 12px 0 8px;
        }

        .header-card p {
          color: #6b7280;
          margin: 0;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .back-button:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #374151;
        }

        .drop-zone {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 2px dashed #d1d5db;
          border-radius: 16px;
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 16px;
        }

        .drop-zone:hover, .drop-zone.dragging {
          border-color: #16a34a;
          background: rgba(34, 197, 94, 0.05);
        }

        .drop-zone.has-file {
          border-color: #16a34a;
          border-style: solid;
          background: rgba(34, 197, 94, 0.05);
        }

        .drop-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .drop-text {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .drop-hint {
          font-size: 14px;
          color: #9ca3af;
        }

        .file-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .file-name {
          font-size: 16px;
          font-weight: 600;
          color: #16a34a;
        }

        .file-size {
          font-size: 14px;
          color: #6b7280;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
          color: #dc2626;
          font-size: 14px;
        }

        .upload-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .upload-button:hover:not(:disabled) {
          background: #15803d;
        }

        .upload-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .success-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
        }

        .success-card h2 {
          font-size: 22px;
          color: #16a34a;
          margin: 16px 0 4px;
        }

        .month-label {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 24px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .summary-item {
          background: rgba(255, 255, 255, 0.4);
          border-radius: 10px;
          padding: 12px;
        }

        .summary-number {
          font-size: 24px;
          font-weight: bold;
          color: #16a34a;
        }

        .summary-label {
          font-size: 12px;
          color: #6b7280;
        }

        .warnings {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #d97706;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .view-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 32px;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .view-button:hover {
          background: #15803d;
        }

        .spinner-sm {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
