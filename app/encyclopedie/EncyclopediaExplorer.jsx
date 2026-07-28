'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, Database, Layers3, Search } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

const PHASES = [
  { key: 'all', label: 'Tous les volumes' },
  { key: 'fondations', label: 'Fondations · V00–V10' },
  { key: 'rédaction', label: 'Rédaction · V11–V40' },
  { key: 'moteur', label: 'Moteur · V41–V47' },
]

const PHASE_LABELS = {
  fondations: 'Fondations',
  rédaction: 'Rédaction',
  moteur: 'Moteur',
}

const normalize = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()

const formatNumber = (value) => value == null
  ? '—'
  : new Intl.NumberFormat('fr-FR').format(value)

const bookMatches = (book, query) => !query || normalize([
  book.code,
  book.title,
  book.mission,
  book.kind,
  ...book.required_fields,
  ...book.quality_gates,
].join(' ')).includes(query)

function VolumeCard({ volume, query }) {
  const volumeMatches = !query || normalize([
    volume.code,
    volume.title,
    volume.mission,
    volume.phase,
  ].join(' ')).includes(query)
  const displayedBooks = volumeMatches
    ? volume.books
    : volume.books.filter((book) => bookMatches(book, query))
  const hasProgress = volume.progress_percent != null

  return (
    <details className={`enc-volume enc-volume-${volume.phase}`} id={volume.code.toLowerCase()}>
      <summary>
        <span className="enc-code">{volume.code}</span>
        <span className="enc-volume-heading">
          <strong>{volume.title}</strong>
          <small>{volume.books.length} livre{volume.books.length > 1 ? 's' : ''} · {PHASE_LABELS[volume.phase]}</small>
        </span>
        <span className="enc-volume-metric">
          <strong>{formatNumber(volume.validated_entries)}</strong>
          <small>{volume.target == null ? 'entrées validées' : `validées sur ${formatNumber(volume.target)}`}</small>
        </span>
      </summary>

      <div className="enc-volume-body">
        <p className="enc-mission">{volume.mission}</p>

        <div className="enc-contract">
          <span>
            <b>Sources</b>
            {volume.source_contracts.join(' · ') || 'Doctrine Myko'}
          </span>
          <span>
            <b>Dépendances</b>
            {volume.dependencies.join(' · ') || 'Aucune'}
          </span>
          <span>
            <b>Mesure</b>
            {volume.metric_source === 'supabase' ? 'Inventaire Supabase live' : 'Inventaire versionné'}
          </span>
        </div>

        <div className="enc-stage-grid" aria-label={`État de production de ${volume.title}`}>
          <span>
            <b>{formatNumber(volume.inventory_entries)}</b>
            <small>inventoriées</small>
          </span>
          <span>
            <b>{formatNumber(volume.drafted_entries)}</b>
            <small>rédigées</small>
          </span>
          <span>
            <b>{formatNumber(volume.validated_entries)}</b>
            <small>validées</small>
          </span>
        </div>

        {hasProgress && (
          <div className="enc-progress-wrap">
            <div className="enc-progress-label">
              <span>Complétude validée</span>
              <strong>{volume.progress_percent} %</strong>
            </div>
            <div
              className="enc-progress"
              role="progressbar"
              aria-label={`Couverture de ${volume.title}`}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={volume.progress_percent}
            >
              <span style={{ width: `${volume.progress_percent}%` }} />
            </div>
          </div>
        )}

        <ol className="enc-books">
          {displayedBooks.map((book) => (
            <li key={book.code} className="enc-book">
              <span className="enc-book-code">{book.code}</span>
              <div>
                <h3>{book.title}</h3>
                <p>{book.mission}</p>
                <div className="enc-book-meta">
                  <span>{book.kind}</span>
                  <span>contenu : {book.content_status}</span>
                  <span>{book.required_fields.length} champs obligatoires</span>
                  <span>{book.quality_gates.length} contrôles</span>
                </div>
                <details className="enc-book-contract">
                  <summary>Voir le contrat du livre</summary>
                  <div>
                    <section>
                      <h4>Champs obligatoires</h4>
                      <ul>
                        {book.required_fields.map((field) => <li key={field}>{field}</li>)}
                      </ul>
                    </section>
                    <section>
                      <h4>Portes de qualité</h4>
                      <ul>
                        {book.quality_gates.map((gate) => <li key={gate}>{gate}</li>)}
                      </ul>
                    </section>
                  </div>
                </details>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </details>
  )
}

export default function EncyclopediaExplorer({ initialView }) {
  const [view, setView] = useState(initialView)
  const [phase, setPhase] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    let active = true
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user || !active) return
      try {
        const response = await authFetch('/api/encyclopedie', { cache: 'no-store' })
        const data = await response.json()
        if (active && response.ok && data?.volumes) setView(data)
      } catch {
        // Le registre structurel versionné reste disponible en mode dégradé.
      }
    })
    return () => { active = false }
  }, [])

  const query = normalize(search.trim())
  const filteredVolumes = useMemo(() => view.volumes.filter((volume) => {
    if (phase !== 'all' && volume.phase !== phase) return false
    if (!query) return true
    if (normalize([volume.code, volume.title, volume.mission, volume.phase].join(' ')).includes(query)) {
      return true
    }
    return volume.books.some((book) => bookMatches(book, query))
  }), [phase, query, view.volumes])

  const summary = view.generated_summary
  const canonicalRecipes = view.live_summary?.recipe_families ?? summary.recipes
  const canonicalFoods = view.live_summary?.food_concepts ?? summary.food_concepts
  const dataLabel = view.data_status === 'live' ? 'Inventaire Supabase live' : 'Inventaire versionné'

  return (
    <div className="v21-page wide enc-page">
      <section className="v21-hero enc-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Édition {view.edition.code}</span>
          <h1 className="v21-title">Encyclopédie<br />culinaire</h1>
          <div className="v21-rule" />
          <p className="v21-lede">
            Le chantier éditorial qui doit être intégralement rédigé et validé
            avant l’intégration des ingrédients, recettes et interactions.
          </p>
        </div>
        <div className="enc-live-badge" title={dataLabel}>
          <Database size={18} aria-hidden="true" />
          <span>{dataLabel}</span>
        </div>
      </section>

      <section className="v21-stats cols-4 enc-stats" aria-label="Résumé du corpus">
        <div className="v21-stat">
          <span className="v21-stat-l">Volumes validés</span>
          <span className="v21-stat-v">{summary.validated_volumes}</span>
          <span className="v21-stat-s"><Layers3 size={13} /> sur {summary.volumes}</span>
        </div>
        <div className="v21-stat">
          <span className="v21-stat-l">Livres validés</span>
          <span className="v21-stat-v">{summary.validated_books}</span>
          <span className="v21-stat-s"><BookOpen size={13} /> sur {summary.books} structurés</span>
        </div>
        <div className="v21-stat">
          <span className="v21-stat-l">Recettes inventoriées</span>
          <span className="v21-stat-v">{formatNumber(canonicalRecipes)}</span>
          <span className="v21-stat-s">{formatNumber(summary.validated_recipes)} validées</span>
        </div>
        <div className="v21-stat">
          <span className="v21-stat-l">Ingrédients inventoriés</span>
          <span className="v21-stat-v">{formatNumber(canonicalFoods)}</span>
          <span className="v21-stat-s"><CheckCircle2 size={13} /> {formatNumber(summary.validated_food_concepts)} validés</span>
        </div>
      </section>

      <section className="enc-gate" role="status">
        <strong>Intégration bloquée</strong>
        <p>
          Une cible atteinte par des noms ou des lignes de base ne suffit pas.
          Chaque fiche doit être rédigée, sourcée, reliée et validée avant de compter.
        </p>
      </section>

      <section className="enc-doctrine" aria-label="Doctrine de l'encyclopédie">
        <p>{view.edition.doctrine[0]}</p>
        <p>{view.edition.doctrine[6]}</p>
        <p>{view.edition.doctrine[7]}</p>
      </section>

      <div className="v21-tabs enc-tabs" role="group" aria-label="Filtrer par phase">
        {PHASES.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`v21-tab${phase === item.key ? ' on' : ''}`}
            onClick={() => setPhase(item.key)}
            aria-pressed={phase === item.key}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="v21-toolbar enc-toolbar">
        <label className="enc-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Rechercher un volume ou un livre</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un volume, un livre, un champ…"
          />
        </label>
        <span className="enc-result-count">
          {filteredVolumes.length} volume{filteredVolumes.length > 1 ? 's' : ''}
        </span>
      </div>

      <section className="enc-volume-list" aria-live="polite">
        {filteredVolumes.map((volume) => (
          <VolumeCard key={volume.code} volume={volume} query={query} />
        ))}
        {!filteredVolumes.length && (
          <div className="v21-empty enc-empty">
            <p>Aucun volume ne correspond à cette recherche.</p>
            <button type="button" className="v21-btn ghost" onClick={() => setSearch('')}>
              Effacer la recherche
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
