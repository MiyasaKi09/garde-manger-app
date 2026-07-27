'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Ban, Heart, Plus, RefreshCw, Sparkles, Trash2, Users } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'
import { toast } from '@/components/Toast'

// Lot 2 du plan de refonte — questionnaire de goûts (§5).
// Les réponses sont INDIVIDUELLES ; le compromis de foyer est calculé par le
// moteur et affiché ici en lecture seule, désaccords compris.

const APPRECIATIONS = [
  { value: 'forbidden', label: 'Interdit', hint: 'Jamais servi, sans exception' },
  { value: 'disliked', label: 'Détesté', hint: 'À ne pas proposer' },
  { value: 'avoided', label: 'Plutôt évité', hint: 'De temps en temps, à la rigueur' },
  { value: 'neutral', label: 'Neutre', hint: 'Ni envie ni rejet' },
  { value: 'liked', label: 'Apprécié', hint: 'Fait plaisir' },
  { value: 'favorite', label: 'Favori', hint: 'Peut revenir souvent' },
  { value: 'to_discover', label: 'À découvrir', hint: 'Jamais goûté, curieux d’essayer' },
]

const SUBJECTS = [
  { value: 'ingredient', label: 'Un aliment', placeholder: 'coriandre, aubergine, chèvre…' },
  { value: 'recipe', label: 'Un plat', placeholder: 'carbonade flamande, pâtes au pesto…' },
  { value: 'cuisine', label: 'Une cuisine', placeholder: 'italienne, thaïe, marocaine…' },
  { value: 'technique', label: 'Une cuisson', placeholder: 'friture, mijotage, vapeur…' },
  { value: 'texture', label: 'Une texture', placeholder: 'crémeux, croquant, fondant…' },
  { value: 'sensory_profile', label: 'Un profil aromatique', placeholder: 'épicé, acidulé, sucré-salé…' },
  { value: 'temperature', label: 'Chaud ou froid', placeholder: 'chaud, froid' },
  { value: 'richness', label: 'Riche ou léger', placeholder: 'riche, léger' },
  { value: 'vegetarian', label: 'Végétarien ou carné', placeholder: 'végétarien, carné' },
  { value: 'leftovers', label: 'Les restes', placeholder: 'restes' },
]

const REPEAT_CHOICES = [
  { value: '', label: 'Au rythme de Myko' },
  { value: '7', label: 'Chaque semaine' },
  { value: '14', label: 'Une semaine sur deux' },
  { value: '30', label: 'Une fois par mois' },
  { value: '90', label: 'Rarement' },
]

const APPRECIATION_LABEL = Object.fromEntries(APPRECIATIONS.map((item) => [item.value, item.label]))
const NEGATIVE = new Set(['forbidden', 'disliked', 'avoided'])

export default function TastesSettingsPage() {
  const router = useRouter()
  const [members, setMembers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [preferences, setPreferences] = useState([])
  const [household, setHousehold] = useState(null)
  const [draft, setDraft] = useState({ subject_type: 'ingredient', subject_label: '', appreciation: 'liked', repeat_delay_days: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [unavailable, setUnavailable] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const membersResponse = await authFetch('/api/household/members')
      const membersData = await membersResponse.json().catch(() => ({}))
      if (!membersResponse.ok) throw new Error(membersData.error || 'Foyer indisponible')
      const list = membersData.members || membersData.items || []
      setMembers(list)
      setSelectedId((current) => current || list[0]?.id || '')

      const response = await authFetch('/api/settings/taste-preferences')
      const data = await response.json().catch(() => ({}))
      if (response.status === 503) {
        // La migration des goûts n'est pas encore appliquée : l'écran
        // l'annonce au lieu d'afficher une erreur muette.
        setUnavailable(data.error || 'Profil de goûts indisponible')
        return
      }
      if (!response.ok) throw new Error(data.error || 'Profil de goûts indisponible')
      setUnavailable(null)
      setPreferences(data.items || [])
      setHousehold(data.household || null)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const selected = useMemo(() => members.find((member) => String(member.id) === String(selectedId)) || null, [members, selectedId])
  const memberPreferences = useMemo(
    () => preferences.filter((item) => String(item.household_member_id) === String(selectedId)),
    [preferences, selectedId],
  )
  const subjectMeta = SUBJECTS.find((item) => item.value === draft.subject_type) || SUBJECTS[0]

  async function addPreference(event) {
    event.preventDefault()
    if (!selected || !draft.subject_label.trim() || saving) return
    setSaving(true)
    try {
      const response = await authFetch('/api/settings/taste-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_member_id: selected.id,
          subject_type: draft.subject_type,
          subject_label: draft.subject_label.trim(),
          appreciation: draft.appreciation,
          repeat_delay_days: draft.repeat_delay_days ? Number(draft.repeat_delay_days) : null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Enregistrement impossible')
      setDraft((current) => ({ ...current, subject_label: '', repeat_delay_days: '' }))
      await load()
      toast.success(`Goût de ${selected.name} enregistré`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function removePreference(id) {
    try {
      const response = await authFetch(`/api/settings/taste-preferences?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Suppression impossible')
      await load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const householdSubjects = useMemo(() => Object.values(household?.subjects || {})
    .sort((left, right) => Number(right.dissenting) - Number(left.dissenting)
      || left.subjectType.localeCompare(right.subjectType)
      || String(left.label).localeCompare(String(right.label))), [household])

  if (loading) return <div className="ts-loading"><RefreshCw className="ts-spin" /> Chargement du profil de goûts…</div>

  return (
    <main className="ts-shell">
      <button type="button" className="ts-back" onClick={() => router.push('/settings')}><ArrowLeft size={15} /> Paramètres</button>

      <header className="ts-hero">
        <div>
          <span className="ts-eyebrow">Paramètres · Goûts</span>
          <h1>Ce que chacun aime</h1>
          <p>
            Myko planifie pour des personnes, pas pour une moyenne. Chacun répond pour soi ;
            le moteur en déduit un compromis de foyer — un refus l’emporte toujours, une envie se partage.
          </p>
        </div>
      </header>

      {unavailable ? (
        <section className="ts-card ts-unavailable">
          <h2>Migration requise</h2>
          <p>{unavailable}</p>
          <p className="ts-help">
            Applique la migration <code>20260727120000_member_taste_preferences.sql</code>,
            puis recharge cette page. En attendant, le planning continue de fonctionner avec
            les allergies, régimes et interdits déjà enregistrés.
          </p>
        </section>
      ) : (
        <>
          <nav className="ts-person-tabs" aria-label="Membre à régler">
            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                className={String(member.id) === String(selectedId) ? 'active' : ''}
                onClick={() => setSelectedId(member.id)}
              >
                {member.name}
              </button>
            ))}
          </nav>

          <div className="ts-layout">
            <section className="ts-card">
              <div className="ts-card-head">
                <div>
                  <span className="ts-step">01 · Réponses</span>
                  <h2>{selected ? `Les goûts de ${selected.name}` : 'Les goûts'}</h2>
                </div>
                <Heart size={18} />
              </div>

              <form className="ts-form" onSubmit={addPreference}>
                <label>
                  <span>Ça porte sur</span>
                  <select value={draft.subject_type} onChange={(event) => setDraft((current) => ({ ...current, subject_type: event.target.value }))}>
                    {SUBJECTS.map((subject) => <option key={subject.value} value={subject.value}>{subject.label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Lequel</span>
                  <input
                    type="text"
                    value={draft.subject_label}
                    placeholder={subjectMeta.placeholder}
                    onChange={(event) => setDraft((current) => ({ ...current, subject_label: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Ce qu’on en pense</span>
                  <select value={draft.appreciation} onChange={(event) => setDraft((current) => ({ ...current, appreciation: event.target.value }))}>
                    {APPRECIATIONS.map((item) => <option key={item.value} value={item.value}>{item.label} — {item.hint}</option>)}
                  </select>
                </label>
                <label>
                  <span>Peut revenir</span>
                  <select value={draft.repeat_delay_days} onChange={(event) => setDraft((current) => ({ ...current, repeat_delay_days: event.target.value }))}>
                    {REPEAT_CHOICES.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
                  </select>
                </label>
                <button type="submit" disabled={saving || !draft.subject_label.trim()}>
                  <Plus size={14} /> Enregistrer
                </button>
              </form>

              <div className="ts-list">
                {memberPreferences.length === 0 && <p className="ts-empty">Aucune réponse pour l’instant.</p>}
                {memberPreferences.map((item) => (
                  <div key={item.id} className={`ts-item ${NEGATIVE.has(item.appreciation) ? 'negative' : 'positive'}`}>
                    <span>
                      <b>{item.subject_label || item.subject_value}</b>
                      <small>
                        {SUBJECTS.find((subject) => subject.value === item.subject_type)?.label || item.subject_type}
                        {' · '}{APPRECIATION_LABEL[item.appreciation] || item.appreciation}
                        {item.repeat_delay_days ? ` · retour ${item.repeat_delay_days} j` : ''}
                        {item.source === 'feedback' ? ' · appris d’un repas' : ''}
                      </small>
                    </span>
                    <button type="button" onClick={() => removePreference(item.id)} aria-label="Supprimer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="ts-card ts-side">
              <div className="ts-card-head">
                <div>
                  <span className="ts-step">02 · Compromis</span>
                  <h2>Ce que Myko en déduit</h2>
                </div>
                <Users size={18} />
              </div>
              <p className="ts-help">
                Recalculé à chaque génération, jamais figé. Les désaccords sont signalés :
                Myko retient alors l’avis le plus prudent.
              </p>
              <div className="ts-list">
                {householdSubjects.length === 0 && <p className="ts-empty">Rien à concilier pour l’instant.</p>}
                {householdSubjects.map((subject) => (
                  <div key={`${subject.subjectType}|${subject.subjectValue}`} className={`ts-item ${NEGATIVE.has(subject.appreciation) ? 'negative' : 'positive'}`}>
                    <span>
                      <b>
                        {subject.appreciation === 'forbidden' && <Ban size={12} />}
                        {subject.appreciation === 'favorite' && <Sparkles size={12} />}
                        {' '}{subject.label}
                      </b>
                      <small>
                        {APPRECIATION_LABEL[subject.appreciation] || subject.appreciation}
                        {subject.dissenting ? ' · avis partagés dans le foyer' : ''}
                        {subject.repeatDelayDays ? ` · retour ${subject.repeatDelayDays} j` : ''}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      <style jsx>{`
        .ts-shell{width:min(100% - 40px,1280px);margin:0 auto;padding:32px 0 60px}
        .ts-back{display:inline-flex;align-items:center;gap:7px;min-height:36px;border:0;background:transparent;color:var(--ink-3);font-family:var(--font-mono);font-size:9px;text-transform:uppercase;cursor:pointer}
        .ts-hero{padding-bottom:28px;border-bottom:1px solid var(--ink-1)}
        .ts-eyebrow,.ts-step{color:var(--terracotta);font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
        .ts-hero h1{max-width:760px;margin:8px 0;font-family:var(--font-display);font-size:clamp(38px,5vw,62px);line-height:.98;letter-spacing:-.04em}
        .ts-hero p{max-width:680px;margin:0;color:var(--ink-2);font-size:15px;line-height:1.55}
        .ts-person-tabs{display:flex;flex-wrap:wrap;gap:8px;padding:20px 0;border-bottom:1px solid var(--line-strong)}
        .ts-person-tabs button{min-height:42px;padding:0 16px;border:1px solid var(--line-strong);border-radius:99px;background:transparent;color:var(--ink-2);cursor:pointer}
        .ts-person-tabs button.active{border-color:var(--terracotta);background:var(--terracotta);color:#fff}
        .ts-layout{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:22px;padding-top:22px}
        .ts-card{padding:24px;border:1px solid var(--line-strong);border-radius:9px;background:rgba(255,255,255,.18)}
        .ts-side{align-self:start;position:sticky;top:20px}
        .ts-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px}
        .ts-card-head h2{margin:5px 0 0;font-family:var(--font-display);font-size:26px;line-height:1}
        .ts-card-head>svg{color:var(--terracotta)}
        .ts-help{margin:-6px 0 16px;color:var(--ink-3);font-size:12px;line-height:1.55}
        .ts-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .ts-form label{display:flex;flex-direction:column;gap:7px}
        .ts-form label>span{font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3)}
        .ts-form input,.ts-form select{width:100%;min-height:43px;padding:0 12px;border:1px solid var(--line-strong);border-radius:5px;background:rgba(255,255,255,.42);color:var(--ink-1);font:inherit}
        .ts-form button{grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:7px;min-height:44px;border:1px solid var(--brand);border-radius:6px;background:var(--brand);color:#fff;font-family:var(--font-mono);font-size:10px;font-weight:700;text-transform:uppercase;cursor:pointer}
        .ts-form button:disabled{opacity:.5;cursor:default}
        .ts-list{display:flex;flex-direction:column;gap:7px;margin-top:18px}
        .ts-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 11px;border-left:3px solid var(--brand);background:rgba(46,90,68,.07)}
        .ts-item.negative{border-left-color:var(--terracotta);background:rgba(193,96,60,.08)}
        .ts-item span{display:flex;flex-direction:column;min-width:0}
        .ts-item b{display:flex;align-items:center;gap:5px;font-size:13px}
        .ts-item small{margin-top:2px;color:var(--ink-3);font-family:var(--font-mono);font-size:8px;text-transform:uppercase}
        .ts-item button{display:grid;width:30px;height:30px;place-items:center;border:0;background:transparent;color:var(--ink-3);cursor:pointer}
        .ts-item button:hover{color:var(--terracotta)}
        .ts-empty{color:var(--ink-3);font-size:12px}
        .ts-unavailable{margin-top:22px}
        .ts-unavailable h2{margin:0 0 8px;font-family:var(--font-display);font-size:26px}
        .ts-unavailable code{font-family:var(--font-mono);font-size:11px}
        .ts-loading{display:flex;min-height:60vh;align-items:center;justify-content:center;gap:10px;color:var(--ink-3);font-family:var(--font-mono);font-size:11px}
        .ts-spin{animation:ts-spin .9s linear infinite}@keyframes ts-spin{to{transform:rotate(360deg)}}
        @media(max-width:980px){.ts-layout{grid-template-columns:1fr}.ts-side{position:static}}
        @media(max-width:680px){.ts-shell{width:min(100% - 24px,1280px);padding-top:22px}.ts-form{grid-template-columns:1fr}.ts-person-tabs{overflow-x:auto;flex-wrap:nowrap}}
      `}</style>
    </main>
  )
}
