'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Ban, Check, ChevronLeft, ChevronRight, Heart, ListChecks, Plus, RefreshCw, Sparkles, Trash2, Users } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'
import { toast } from '@/components/Toast'
import { QUESTION_STEPS, WEEKDAYS, answeredCount, answersFromExisting } from './questionnaire'

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

/**
 * Saisie d'une liste courte : un mot, Entrée, on passe au suivant. Une liste
 * vide est une réponse valable — « aucun aliment refusé » se dit en n'ajoutant
 * rien, pas en écrivant « aucun ».
 */
function TagInput({ values = [], placeholder, onChange }) {
  const [text, setText] = useState('')
  const add = () => {
    const value = text.trim()
    if (!value || values.includes(value)) { setText(''); return }
    onChange([...values, value])
    setText('')
  }
  return (
    <div className="ts-tags">
      <div className="ts-tag-row">
        <input
          type="text"
          value={text}
          placeholder={placeholder}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            add()
          }}
        />
        <button type="button" onClick={add} disabled={!text.trim()}><Plus size={14} /></button>
      </div>
      {values.length > 0 && (
        <div className="ts-tag-list">
          {values.map((value) => (
            <span key={value}>
              {value}
              <button type="button" onClick={() => onChange(values.filter((item) => item !== value))} aria-label={`Retirer ${value}`}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TastesSettingsPage() {
  const router = useRouter()
  const [members, setMembers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [preferences, setPreferences] = useState([])
  const [household, setHousehold] = useState(null)
  const [draft, setDraft] = useState({ subject_type: 'ingredient', subject_label: '', appreciation: 'liked', repeat_delay_days: '' })
  const [mode, setMode] = useState('guided')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [stepSaving, setStepSaving] = useState(false)
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

  // Reprendre le parcours là où il s'est arrêté plutôt que de tout redemander.
  useEffect(() => {
    if (!selected) return
    setAnswers(answersFromExisting({
      preferences: memberPreferences,
      planning: selected.preferences?.planning || {},
    }))
    setStepIndex(0)
  }, [selectedId, selected, memberPreferences])

  const step = QUESTION_STEPS[stepIndex] || null
  const progress = answeredCount(answers)

  const setAnswer = (value) => setAnswers((current) => ({ ...current, [step.key]: value }))

  const toggleDay = (day) => {
    const current = Array.isArray(answers[step.key]) ? answers[step.key] : []
    setAnswer(current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort())
  }

  /**
   * Enregistre l'étape courante. Une question de GOÛT écrit dans le profil de
   * goûts ; une question d'ORGANISATION écrit dans les préférences du membre.
   * Les deux destinations sont décrites par l'étape, l'écran n'a pas à savoir
   * laquelle est laquelle.
   */
  async function saveStep() {
    if (!selected || !step || stepSaving) return true
    const value = answers[step.key]
    setStepSaving(true)
    try {
      if (step.kind === 'setting') {
        const planning = { ...(selected.preferences?.planning || {}) }
        if (value == null || value === '') delete planning[step.field]
        else planning[step.field] = step.numeric ? Number(value) : value
        const response = await authFetch(`/api/household/members/${selected.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences: { ...(selected.preferences || {}), planning } }),
        })
        if (!response.ok) throw new Error('Enregistrement impossible')
      } else {
        const labels = step.multiple
          ? (Array.isArray(value) ? value : []).filter(Boolean)
          : (value ? [step.subjectValue || step.key] : [])
        for (const label of labels) {
          const response = await authFetch('/api/settings/taste-preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              household_member_id: selected.id,
              subject_type: step.subjectType,
              subject_label: label,
              // Une question à choix porte l'appréciation choisie ; une question
              // à liste porte celle que l'étape déclare.
              appreciation: step.choices ? value : step.appreciation,
              repeat_delay_days: step.repeatDelayDays ?? null,
            }),
          })
          if (!response.ok) throw new Error('Enregistrement impossible')
        }
      }
      return true
    } catch (error) {
      toast.error(error.message)
      return false
    } finally {
      setStepSaving(false)
    }
  }

  async function goNext() {
    if (!(await saveStep())) return
    if (stepIndex + 1 >= QUESTION_STEPS.length) {
      await load()
      toast.success(`Profil de ${selected.name} enregistré`)
      setMode('free')
      return
    }
    setStepIndex((current) => current + 1)
  }

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

          <div className="ts-modes">
            <button type="button" className={mode === 'guided' ? 'active' : ''} onClick={() => setMode('guided')}>
              <ListChecks size={14} /> Parcours guidé
            </button>
            <button type="button" className={mode === 'free' ? 'active' : ''} onClick={() => setMode('free')}>
              <Plus size={14} /> Ajout libre
            </button>
          </div>

          <div className="ts-layout">
            {mode === 'guided' && step ? (
            <section className="ts-card">
              <div className="ts-card-head">
                <div>
                  <span className="ts-step">
                    Question {stepIndex + 1} sur {QUESTION_STEPS.length} · {progress} renseignée{progress > 1 ? 's' : ''}
                  </span>
                  <h2>{step.title}</h2>
                </div>
                <ListChecks size={18} />
              </div>
              {step.help && <p className="ts-help">{step.help}</p>}

              {step.choices && (
                <div className="ts-choices">
                  {step.choices.map((choice) => (
                    <button
                      key={choice.value}
                      type="button"
                      className={answers[step.key] === choice.value ? 'active' : ''}
                      onClick={() => setAnswer(choice.value)}
                    >
                      <b>{choice.label}</b>
                      {choice.hint && <small>{choice.hint}</small>}
                    </button>
                  ))}
                </div>
              )}

              {step.days && (
                <div className="ts-days">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      className={(answers[step.key] || []).includes(day.value) ? 'active' : ''}
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              )}

              {step.numeric && (
                <input
                  type="number"
                  className="ts-number"
                  min={step.numeric.min}
                  max={step.numeric.max}
                  value={answers[step.key] ?? ''}
                  placeholder="Selon mon niveau de curiosité"
                  onChange={(event) => setAnswer(event.target.value)}
                />
              )}

              {step.multiple && (
                <TagInput
                  values={Array.isArray(answers[step.key]) ? answers[step.key] : []}
                  placeholder={step.placeholder}
                  onChange={setAnswer}
                />
              )}

              <div className="ts-nav">
                <button type="button" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => current - 1)}>
                  <ChevronLeft size={14} /> Précédent
                </button>
                <button type="button" className="ts-skip" onClick={() => setStepIndex((current) => Math.min(current + 1, QUESTION_STEPS.length - 1))}>
                  Passer
                </button>
                <button type="button" className="ts-primary" disabled={stepSaving} onClick={goNext}>
                  {stepIndex + 1 >= QUESTION_STEPS.length
                    ? <><Check size={14} /> Terminer</>
                    : <>Suivant <ChevronRight size={14} /></>}
                </button>
              </div>
            </section>
            ) : (
            <section className="ts-card">
              <div className="ts-card-head">
                <div>
                  <span className="ts-step">Ajout libre</span>
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
            )}

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
        .ts-modes{display:flex;gap:8px;padding:16px 0 0}
        .ts-modes button{display:inline-flex;align-items:center;gap:7px;min-height:38px;padding:0 14px;border:1px solid var(--line-strong);border-radius:6px;background:transparent;color:var(--ink-2);font-family:var(--font-mono);font-size:9px;text-transform:uppercase;cursor:pointer}
        .ts-modes button.active{border-color:var(--brand);background:var(--brand);color:#fff}
        .ts-choices{display:grid;gap:9px}
        .ts-choices button{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:13px;border:1px solid var(--line-strong);border-radius:6px;background:transparent;color:var(--ink-1);text-align:left;cursor:pointer}
        .ts-choices button.active{border-color:var(--terracotta);background:rgba(193,96,60,.1)}
        .ts-choices b{font-size:14px}.ts-choices small{color:var(--ink-3);font-size:11px}
        .ts-days{display:flex;flex-wrap:wrap;gap:7px}
        .ts-days button{min-width:52px;min-height:42px;border:1px solid var(--line-strong);border-radius:6px;background:transparent;color:var(--ink-2);cursor:pointer}
        .ts-days button.active{border-color:var(--terracotta);background:var(--terracotta);color:#fff}
        .ts-number{width:100%;min-height:44px;padding:0 12px;border:1px solid var(--line-strong);border-radius:5px;background:rgba(255,255,255,.42);color:var(--ink-1);font:inherit}
        .ts-tags{display:flex;flex-direction:column;gap:10px}
        .ts-tag-row{display:flex;gap:8px}
        .ts-tag-row input{flex:1;min-height:44px;padding:0 12px;border:1px solid var(--line-strong);border-radius:5px;background:rgba(255,255,255,.42);color:var(--ink-1);font:inherit}
        .ts-tag-row button{display:grid;width:46px;place-items:center;border:1px solid var(--ink-1);border-radius:5px;background:transparent;cursor:pointer}
        .ts-tag-row button:disabled{opacity:.4;cursor:default}
        .ts-tag-list{display:flex;flex-wrap:wrap;gap:6px}
        .ts-tag-list span{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:99px;background:rgba(46,90,68,.1);font-size:12px}
        .ts-tag-list span button{border:0;background:transparent;color:var(--ink-3);font-size:15px;line-height:1;cursor:pointer}
        .ts-nav{display:flex;align-items:center;gap:9px;margin-top:22px}
        .ts-nav button{display:inline-flex;align-items:center;gap:6px;min-height:42px;padding:0 15px;border:1px solid var(--line-strong);border-radius:6px;background:transparent;color:var(--ink-2);font-family:var(--font-mono);font-size:9px;text-transform:uppercase;cursor:pointer}
        .ts-nav button:disabled{opacity:.4;cursor:default}
        .ts-nav .ts-skip{border:0;text-decoration:underline}
        .ts-nav .ts-primary{margin-left:auto;border-color:var(--brand);background:var(--brand);color:#fff}
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
